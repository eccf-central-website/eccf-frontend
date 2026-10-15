async function verify() {
  const query = '*[_type in ["worker", "firstTimer", "welfareRequest", "prayerRequest"]]{ _type, fullName, name, phoneNumber, roomNumber, passwordHash, requestDetails, request, phoneBlindIndex, birthDate, birthMonth, birthDay, birthdayBlindIndex }'
  const url = 'https://ynnot4j0.api.sanity.io/v2024-01-01/data/query/production?query=' + encodeURIComponent(query)
  
  // NOTE: NO Authorization header is sent!
  const res = await fetch(url)
  const data = await res.json()
  
  console.log('Unauthenticated Query Result:')
  for (const doc of data.result) {
    console.log(`\nDoc type: ${doc._type} (${doc.fullName || doc.name || 'Anonymous'})`)
    if (doc.phoneNumber) console.log(`  phoneNumber:        ${doc.phoneNumber.slice(0, 24)}... (Encrypted: ${doc.phoneNumber.startsWith('enc:v1:')})`)
    if (doc.phoneBlindIndex) console.log(`  phoneBlindIndex:    ${doc.phoneBlindIndex.slice(0, 24)}... (Hashed: ${doc.phoneBlindIndex.startsWith('bidx:v1:')})`)
    if (doc.roomNumber) console.log(`  roomNumber:         ${doc.roomNumber.slice(0, 24)}... (Encrypted: ${doc.roomNumber.startsWith('enc:v1:')})`)
    if (doc.requestDetails) console.log(`  requestDetails:     ${doc.requestDetails.slice(0, 24)}... (Encrypted: ${doc.requestDetails.startsWith('enc:v1:')})`)
    if (doc.request) console.log(`  request:            ${doc.request.slice(0, 24)}... (Encrypted: ${doc.request.startsWith('enc:v1:')})`)
    if (doc.birthDate) console.log(`  birthDate:          ${doc.birthDate} (Encrypted: ${doc.birthDate.startsWith('enc:v1:')})`)
    if (doc.birthMonth) console.log(`  birthMonth:         ${doc.birthMonth}`)
    if (doc.birthDay) console.log(`  birthDay:           ${doc.birthDay}`)
    if (doc.birthdayBlindIndex) console.log(`  birthdayBlindIndex: ${doc.birthdayBlindIndex.slice(0, 24)}... (Hashed: ${doc.birthdayBlindIndex.startsWith('bidx:v1:')})`)
    console.log(`  passwordHash:       ${doc.passwordHash ?? 'EXPOSED HASH REMOVED / NULL'}`)
  }
}

verify().catch(console.error)
