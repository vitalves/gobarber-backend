import User from '../models/User';
import File from '../models/File';
import Appointment from '../models/Appointment';

import CreateAppointmentService from '../services/CreateAppointmentService';
import CancelAppointmentService from '../services/CancelAppointmentService';

class AppointmentController {
  // Lista agendamentos
  async index(req, res) {
    // possibilita a paginacao
    const { page = 1 } = req.query; // se 'page' nao for informado o valor e 1

    // seleciona todos
    const appointment = await Appointment.findAll({
      // onde: user_id = req.userId nao cancelados
      where: { user_id: req.userId, canceled_at: null },
      // ordenar por dada
      order: ['date'],
      // Atibutos que serao usados: (pra nao mandar todos):
      // 'past' e 'cancelable' sao um campos VIRTUAL
      attributes: ['id', 'date', 'past', 'cancelable'],
      // PAGINACAO:
      limit: 20,
      offset: (page - 1) * 20, // 20 results por pagina
      // FIM PAGINACAO
      // incluir os dados do prestador de servicos
      include: [
        {
          model: User,
          as: 'provider',
          // atributos a serem retornados
          attributes: ['id', 'name'],
          // incluir o avatar do usuario:
          include: [
            {
              model: File,
              as: 'avatar',
              // atributos necessario do avatar (pra nao mandar todos)
              attributes: ['id', 'path', 'url'], // 'path' é necessario pois e pedido no File.js
            },
          ],
        },
      ],
    });
    return res.json(appointment);
  }

  // cadastra agendamentos
  async store(req, res) {
    const { provider_id, date } = req.body;

    const appointment = await CreateAppointmentService.run({
      provider_id,
      user_id: req.userId,
      date,
    });

    return res.json(appointment);
  }

  // Apaga agendamentos (cancelamento)
  async delete(req, res) {
    const appointment = await CancelAppointmentService.run({
      provider_id: req.params.id,
      user_id: req.userId,
    });
    // retorna os dados atualizados
    return res.json(appointment);
  }
}

export default new AppointmentController();
