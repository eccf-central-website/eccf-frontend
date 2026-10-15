/**
 * ECCF Central Website — Google Apps Script Image Upload Bridge
 * 
 * System Design Reference: SDD §4.6, §5.2, §6.4, §7.1
 * 
 * Receives Base64 encoded images from the client browser / Next.js Server,
 * decodes the binary stream on Google's V8 infrastructure, saves the file
 * to the fellowship's Google Drive shared folder, sets public read permissions,
 * and returns direct CDN image links (https://lh3.googleusercontent.com/d/<id>).
 *
 * This completely relieves Vercel serverless functions from payload bottlenecks
 * (4.5MB request limit) and avoids persistent local disk storage.
 */

/**
 * Handle HTTP POST requests from the client or server proxy.
 */
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return createJsonResponse({
        ok: false,
        error: 'Missing request body or postData.',
      }, 400);
    }

    var payload;
    try {
      payload = JSON.parse(e.postData.contents);
    } catch (parseErr) {
      return createJsonResponse({
        ok: false,
        error: 'Invalid JSON payload: ' + parseErr.message,
      }, 400);
    }

    // Extract fields
    var rawBase64 = payload.base64 || payload.imageBase64 || payload.data;
    var cleanFileName = payload.cleanFileName || payload.fileName || payload.filename;
    var folderId = payload.folderId;
    var mimeType = payload.mimeType || 'image/jpeg';

    if (!rawBase64) {
      return createJsonResponse({
        ok: false,
        error: 'No Base64 image data provided in payload.',
      }, 400);
    }

    // Strip Data URL prefix if present (e.g. data:image/jpeg;base64,...)
    var cleanBase64 = rawBase64;
    if (cleanBase64.indexOf(',') > -1) {
      var header = cleanBase64.split(',')[0];
      cleanBase64 = cleanBase64.split(',')[1];
      
      var match = header.match(/:(.*?);/);
      if (match && match[1]) {
        mimeType = match[1];
      }
    }

    // Remove any unexpected whitespace or newlines
    cleanBase64 = cleanBase64.replace(/\s+/g, '');

    // Default file name if missing: [FullName]_[Team]_BirthdayPic.jpg
    if (!cleanFileName) {
      var namePart = (payload.fullName || 'Worker').toString().replace(/\s+/g, '_');
      var teamPart = (payload.team || 'General').toString().replace(/\s+/g, '_');
      cleanFileName = namePart + '_' + teamPart + '_BirthdayPic.jpg';
    }

    // Decode Base64 to Binary Blob
    var decodedBytes = Utilities.base64Decode(cleanBase64);
    var blob = Utilities.newBlob(decodedBytes, mimeType, cleanFileName);

    // Resolve Google Drive Destination Folder
    var folder = resolveTargetFolder(folderId);

    // File Deduplication / Upsert: Remove prior photo with identical filename if present
    try {
      var existingFiles = folder.getFilesByName(cleanFileName);
      while (existingFiles.hasNext()) {
        var oldFile = existingFiles.next();
        oldFile.setTrashed(true);
      }
    } catch (dedupErr) {
      Logger.log('Deduplication cleanup notice: ' + dedupErr.message);
    }

    // Save File into Google Drive
    var file = folder.createFile(blob);

    // Set Public Permissions: Anyone with the link can view
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    var fileId = file.getId();
    
    // Google's high-speed direct CDN asset link (best for <img> tags and avatars)
    var cdnDirectUrl = 'https://lh3.googleusercontent.com/d/' + fileId;
    
    // Fallback direct download/stream link
    var driveDirectUrl = 'https://drive.google.com/uc?export=view&id=' + fileId;

    return createJsonResponse({
      ok: true,
      fileId: fileId,
      fileUrl: cdnDirectUrl,
      url: cdnDirectUrl,
      directUrl: cdnDirectUrl,
      driveDirectUrl: driveDirectUrl,
      driveViewUrl: file.getUrl(),
      fileName: cleanFileName,
      sizeBytes: decodedBytes.length,
      mimeType: mimeType,
    }, 200);

  } catch (error) {
    Logger.log('Error during image upload: ' + error.toString());
    return createJsonResponse({
      ok: false,
      error: error.message || error.toString(),
    }, 500);
  }
}

/**
 * Handle HTTP GET requests — useful for status/health checks.
 */
function doGet(e) {
  return createJsonResponse({
    ok: true,
    status: 'online',
    service: 'ECCF Google Drive Image Upload Bridge',
    timestamp: new Date().toISOString(),
  }, 200);
}

/**
 * Resolve the target Google Drive Folder.
 * 1. Checks function argument folderId
 * 2. Checks Script Properties 'DRIVE_FOLDER_ID'
 * 3. Fallbacks to searching/creating folder 'ECCF Workforce Birthday Photos' in root Drive
 */
function resolveTargetFolder(folderId) {
  var scriptProperties = PropertiesService.getScriptProperties();
  var configuredFolderId = folderId || scriptProperties.getProperty('DRIVE_FOLDER_ID');

  if (configuredFolderId) {
    try {
      return DriveApp.getFolderById(configuredFolderId.trim());
    } catch (e) {
      Logger.log('Could not find folder by ID (' + configuredFolderId + '), falling back to default folder name.');
    }
  }

  var folderName = 'ECCF Workforce Birthday Photos';
  var folders = DriveApp.getFoldersByName(folderName);
  if (folders.hasNext()) {
    return folders.next();
  }

  // Create folder if it does not exist
  var newFolder = DriveApp.createFolder(folderName);
  newFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  
  // Cache the created folder ID in Script Properties for future queries
  scriptProperties.setProperty('DRIVE_FOLDER_ID', newFolder.getId());
  return newFolder;
}

/**
 * Helper to construct JSON response with proper CORS headers.
 */
function createJsonResponse(data, statusCode) {
  var output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}

/**
 * Test function you can run inside the Apps Script Editor to verify permissions.
 */
function testUpload() {
  // 1x1 transparent GIF base64
  var testBase64 = 'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
  var mockEvent = {
    postData: {
      contents: JSON.stringify({
        base64: testBase64,
        cleanFileName: 'Test_Worker_Media_BirthdayPic.gif',
        mimeType: 'image/gif',
      }),
    },
  };
  var result = doPost(mockEvent);
  Logger.log('Test result: ' + result.getContent());
}
