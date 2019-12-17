// CRIANDO UMA SESSAO (NOVA ENTIDADE)
// importa o JWT
import jwt from 'jsonwebtoken';
// importa Yup para validacao de email e senha
import * as Yup from 'yup';

// importa o usuario que vai logar
import User from '../models/User';
// import o model de files para pegar o avatar do usuário:
import File from '../models/File';
// importa a chave secretos de acesso e prazo de expiracao
import authConfig from '../../config/auth';

class SessionController {
  async store(req, res) {
    // validacoes com Yup (schema validation)
    const schema = Yup.object().shape({
      email: Yup.string()
        .email()
        .required(),
      password: Yup.string().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Falha da validacao' });
    }
    // FIM // validacoes com Yup (schema validation)

    // pega os dados do body da requisicao
    const { email, password } = req.body;

    // busca o usuario no banco
    const user = await User.findOne({
      // where: { email: req.body.email },
      where: { email },
      include: [
        {
          model: File,
          as: 'avatar',
          attributes: ['id', 'path', 'url'],
        },
      ],
    });

    // se o usuario nao existir no BD
    if (!user) {
      return res.status(401).json({ error: 'Usuário não encontrado' });
    }
    // o metodo de verificacao de senha esta dentro do model (checkPassword)
    // fazendo a verificao:
    if (!(await user.checkPassword(password))) {
      return res.status(401).json({ error: 'Senha inválida' });
    }
    // se chegar aqui o email e senha foram conferidos e autenticados
    //  retornar os dados do usuario e gerar o TOKEN
    const { id, name, avatar, provider } = user;
    return res.json({
      user: {
        id,
        name,
        email,
        provider,
        avatar,
      },
      // gerando o token com o id, texto secreto e validade dentro
      // (authConfig) no arquivo config/auth
      token: jwt.sign({ id }, authConfig.secret, {
        expiresIn: authConfig.expiresIn,
      }),
    });
  }
}

export default new SessionController();
