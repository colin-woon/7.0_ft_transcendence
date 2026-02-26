// GET /auth/me
fetch('/auth/me', {credentials:'include'}).then(r=>r.json()).then(d=>console.log(JSON.stringify(d,null,2)))

// PATCH /auth/me
fetch('/auth/me', {method:'PATCH', credentials:'include', headers:{'Content-Type':'application/json'}, body:JSON.stringify({username:'joshuaT', bio:'hello'})}).then(r=>r.json()).then(d=>console.log(JSON.stringify(d,null,2)))

// POST /auth/logout
fetch('/auth/logout', {method:'POST', credentials:'include'}).then(r=>r.text()).then(d=>console.log(d))

// DELETE /auth/delete
fetch('/auth/delete', {method:'DELETE', credentials:'include'}).then(r=>r.text()).then(d=>console.log(d))

// POST /auth/refresh
fetch('/auth/refresh', {method:'POST', credentials:'include'}).then(r=>r.json()).then(d=>console.log(JSON.stringify(d,null,2)))
