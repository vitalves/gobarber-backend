// AQUIVO Faz uma verificacao se o usuario estar logado
// importa o JWT para usar o metodo verify
import jwt from 'jsonwebtoken'; //
// para usar o padrao async await no try catch usa o promisify do util
import { promisify } from 'util'; // util e biblio padrao vem junto com o NODE

import authConfig from '../../config/auth'; // pega o segredo do token

export default async (req, res, next) => {
  // async usado devido o promisify
  // Bearer authorization token na requisicao
  const authHeader = req.headers.authorization;
  // console.log(authHeader);

  if (!authHeader) {
    return res.status(401).json({ error: 'Token nao recebido' });
  }

  // RECEBE: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6I(...)
  // dividir a BEARER a partir do espaço ' ' com o split
  // const token = authHeader.split(' '); // retorna array com as 2 partes de Bearer
  // const token desestruturada: pega apenas o token
  const [, token] = authHeader.split(' ');

  // usar try catch pois pode retornar erro
  try {
    // promisify pega uma funcao de call back e transforma em funcao q pode usar async await
    const decoded = await promisify(jwt.verify)(token, authConfig.secret); // valor retornado atraves do JWT verify
    // acima ha uma funcao que retorna uma funcao e é chamada por ela mesma

    // console.log(decoded); // retorna { id: XX, iat: 1566855776, exp: 1567460576 }

    // incluir o ID do usuario dentro o req.
    req.userId = decoded.id;

    return next(); // se chegou ate aqui e pq esta autenticado
  } catch (err) {
    // se retorna erro significa que o token é invalido
    return res.status(401).json({ error: 'Token inválido' });
  }

  // next();
};
