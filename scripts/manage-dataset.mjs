async function setDatasetPrivate() {
  const token = process.env.SANITY_WRITE_TOKEN
  const projectId = 'ynnot4j0'
  const dataset = 'production'
  
  // Try PATCH /projects/:id/datasets/:name
  let res = await fetch(`https://api.sanity.io/v2021-06-07/projects/${projectId}/datasets/${dataset}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ aclMode: 'private' })
  })

  let text = await res.text()
  console.log(`PATCH response (${res.status}):`, text)

  if (res.status === 404 || res.status === 405) {
    // Try PUT
    res = await fetch(`https://api.sanity.io/v2021-06-07/projects/${projectId}/datasets/${dataset}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ aclMode: 'private' })
    })
    text = await res.text()
    console.log(`PUT response (${res.status}):`, text)
  }

  // Check again
  const check = await fetch(`https://api.sanity.io/v2021-06-07/projects/${projectId}/datasets`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  console.log('Current Datasets:', await check.json())
}

setDatasetPrivate().catch(console.error)
