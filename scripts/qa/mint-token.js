// QA only: mint a NextAuth JWT using a DUMMY secret set for the test servers.
// Never run against an environment whose real NEXTAUTH_SECRET you hold.
const { encode } = require('next-auth/jwt')
const secret = process.env.QA_SECRET
const token  = JSON.parse(process.env.QA_TOKEN)
encode({ token, secret, maxAge: 3600 }).then(t => console.log(t))
