// import o model User para busca
import User from '../models/User';
import Notification from '../schemas/Notification';

class NotificationController {
  async index(req, res) {
    const checkIsProvider = await User.findOne({
      where: { id: req.userId, provider: true },
    });

    // verifica se e prestador de servicos
    if (!checkIsProvider) {
      return res
        .status(401)
        .json({ error: 'Somente prestador de servico pode ler notificacoes' });
    }

    const notifications = await Notification.find({
      user: req.userId,
    })
      .sort({ createdAt: 'desc' }) // ordenacao
      .limit(20);

    return res.json(notifications);
  }

  async update(req, res) {
    // Busca a notificacao no BD
    // const notification = await Notification.findById(req.params.id);

    // Metodo do Mongoose que permite atualizar na busca
    const notification = await Notification.findByIdAndUpdate(
      req.params.id, // informacao recebida
      { read: true }, // campo que deve ser atualizado
      { new: true } // (Opcional) retorna o campo ja atualizado
    );

    return res.json(notification);
  }
}

export default new NotificationController();
