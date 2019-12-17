export default {
  secret: process.env.APP_SECRET, // chave secreta (pode ser em MD5)
  expiresIn: '7d', // Tempo de expiracao do token
};
