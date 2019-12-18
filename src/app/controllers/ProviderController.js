// importa o model User pois o Provider é um usuario
import User from '../models/User';
// import o File para trabalhar com o avatar
import File from '../models/File';

import Cache from '../../lib/Cache';

class ProviderController {
  async index(req, res) {
    // veirifica se os dados ja existem no cache do Redis
    const cached = await Cache.get('providers');

    if (cached) {
      return res.json(cached);
    }

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

    await Cache.set('providers', providers); // salva no cacha do Redis

    return res.json(providers);
  }
}

export default new ProviderController();
