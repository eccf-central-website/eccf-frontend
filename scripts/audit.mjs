async function audit() {
  const query = `{
    "exposedPasswordHashes": count(*[_type == "worker" && defined(passwordHash)]),
    "plainPhoneNumbers": count(*[defined(phoneNumber) && !string::startsWith(phoneNumber, "enc:v1:")]),
    "plainRoomNumbers": count(*[defined(roomNumber) && !string::startsWith(roomNumber, "enc:v1:")]),
    "plainBirthDates": count(*[_type == "worker" && defined(birthDate) && !string::startsWith(birthDate, "enc:v1:")]),
    "exposedBirthMonths": count(*[_type == "worker" && defined(birthMonth)]),
    "exposedBirthDays": count(*[_type == "worker" && defined(birthDay)]),
    "plainWelfareDetails": count(*[_type == "welfareRequest" && !string::startsWith(requestDetails, "enc:v1:")]),
    "plainPrayerRequests": count(*[_type == "prayerRequest" && !string::startsWith(request, "enc:v1:")])
  }`
  const url = 'https://ynnot4j0.api.sanity.io/v2024-01-01/data/query/production?query=' + encodeURIComponent(query)
  const res = await fetch(url)
  const data = await res.json()
  console.log('--- Zero-Knowledge Security Audit Results ---')
  console.log(JSON.stringify(data.result, null, 2))
}
audit().catch(console.error)
