// importa o model User pois o Provider é um usuario
import User from '../models/User';
// import o File para trabalhar com o avatar
import File from '../models/File';

class ProviderController {
  async index(req, res) {
    const providers = await User.findAll({
      where: { provider: true },
      attributes: ['id', 'name', 'email', 'avatar_id'],
      // include: [File],
      include: {
        model: File,
        as: 'avatar',
        attributes: ['name', 'path', 'url'],
      },
    });

    return res.json(providers);
  }
}

export default new ProviderController();
