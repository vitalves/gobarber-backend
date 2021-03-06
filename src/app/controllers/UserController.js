// YUP biblioteca para validadacao de dados
// import * as Yup from 'yup'; // Yup se importação default (importa-se tudo)
// importa o model de usuario
import User from '../models/User';
// importa o model de File para pegar o Avatar
import File from '../models/File';

import Cache from '../../lib/Cache';

class UserController {
  async store(req, res) {
    // verifica se o usuario ja existe
    const userExists = await User.findOne({ where: { email: req.body.email } });

    if (userExists) {
      return res.status(400).json({ error: 'Usuário já existe' });
    }

    /* RETORNANDO TUDO:
    // cadastra no banco
    const user = await User.create(req.body);
    // retorna os dados cadastrados
    return res.json(user);
    */

    // RETORNANDO APENAS OS DADOS DESEJADOS:
    const { id, name, email, provider } = await User.create(req.body);

    // Resetar o cache se o usuario cadastrado for um provider
    if (provider) {
      await Cache.invalidate('providers');
    }

    return res.json({
      id,
      name,
      email,
      provider,
    });
  }

  // alteracores de cadastro do usuario logado
  async update(req, res) {
    // atualizar dados do usuario
    const { email, oldPassword } = req.body;

    // pegar o ID do usuario:  (findByPkfind by primary kye)
    const user = await User.findByPk(req.userId); // userId gerado dentro do middleware auth

    // verifica se o email ja existe caso esteja alterando o email
    // (se email recebido no body é igual ao email recebido na busca no BD)
    if (email !== user.email) {
      const userExists = await User.findOne({ where: { email } });

      if (userExists) {
        return res.status(400).json({ error: 'Email já em uso' });
      }
    }

    // verifica se a senha enviada esta correta (oldPassword)
    // somente se o usuario estiver querendo alterar a senha (oldPassword &&)
    // ou seja, se inserir a senha antiga
    if (oldPassword && !(await user.checkPassword(oldPassword))) {
      return res.status(401).json({ error: 'Senha atual incorreta' });
    }

    // Atualiza no banco
    /* RETORNA TUDO:
    const user = await user.update(req.body);
    */
    // retorna dados:
    // const { id, name, provider } = await user.update(req.body);
    // insere os dados no banco
    await user.update(req.body);

    // refaz a busca pelo usuario pegando agora também o Avatar
    const { id, name, avatar } = await User.findByPk(req.userId, {
      include: [
        {
          model: File,
          as: 'avatar',
          attributes: ['id', 'path', 'url'],
        },
      ],
    });

    return res.json({
      id,
      name,
      email,
      avatar,
    });
  }
}

export default new UserController();
