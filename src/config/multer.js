import multer from 'multer';
// para gerar caracters aleatorios:
import crypto from 'crypto'; // bibl padrao no Node
// extname name p/ retorna a extensao do arquivo
// resolve para percorrer um caminho dentro da aplic
import { extname, resolve } from 'path';

// exporta um objetoo de configuracao
export default {
  // chaves:
  storage: multer.diskStorage({
    // destino do arquivo: (os diretorios '/tmp/uploads' sao criados)
    destination: resolve(__dirname, '..', '..', 'tmp', 'uploads'),
    // nome do arquivo:
    filename: (req, file, cb) => {
      crypto.randomBytes(16, (err, res) => {
        if (err) return cb(err);
        return cb(null, res.toString('hex') + extname(file.originalname));
      });
    },
  }),
};
