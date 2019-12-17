// Para trabalhar com as datas
import { startOfDay, endOfDay, parseISO } from 'date-fns';
// operadores do sequelize (para usar o op between)
import { Op } from 'sequelize';

import User from '../models/User';
import Appointment from '../models/Appointment';

class ScheduleController {
  async index(req, res) {
    const checkUserProvider = await User.findOne({
      where: { id: req.userId, provider: true },
    });

    if (!checkUserProvider) {
      return res.status(401).json({ error: 'Usuario nao e um provider ' });
    }

    const { date } = req.query; // data recebida na requisicao
    const parsedDate = parseISO(date);

    // busca os agendamentos

    const appointments = await Appointment.findAll({
      where: {
        // consultor for o usuario logado
        provider_id: req.userId,
        // nao esteja cancelado
        canceled_at: null,
        // comparacao entre
        date: {
          // berween faz comparacao entre dois valores
          // que a data esteja entre o começo e o final da data recebida
          [Op.between]: [startOfDay(parsedDate), endOfDay(parsedDate)],
        },
      },
      // inclue os dados do usuario e retorna o nome:
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['name'],
        },
      ],
      // ordenar por data
      order: ['date'],
    });

    return res.json(appointments);
  }
}

export default new ScheduleController();
