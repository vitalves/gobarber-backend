/*
 * SELECIONA OS AGENDAMENTOS DO DIA DENTRO DO HORARIO DEFINIDO
 */
// date-fns para trabalhar com manipulacao de datas:
import {
  startOfDay,
  endOfDay,
  setHours,
  setMinutes,
  setSeconds,
  format,
  isAfter,
} from 'date-fns';
// importa o Op do sequelize para trabalhar com intervalos de datas:
import { Op } from 'sequelize';
// importa o model de agendamentos:
import Appointment from '../models/Appointment';

class AvailableController {
  async index(req, res) {
    const { date } = req.query; // new Date().getTime() :: timestamp 1567701796781

    // verifica se a data e informada
    if (!date) {
      return res.status(400).json({ error: 'Data invalida' });
    }

    // garantir que a data seja um numero Inteiro
    const searchDate = Number(date); // 2019-09-05 15:11:25

    // busca os agendamentos no banco
    const appointments = await Appointment.findAll({
      // condicoes
      where: {
        provider_id: req.params.providerId,
        canceled_at: null,
        // filtro por data
        date: {
          [Op.between]: [startOfDay(searchDate), endOfDay(searchDate)],
        },
      },
    });

    // Horarios disponiveis que o o pretador possui no dia
    const schedule = [
      '08:00', // 2019-09-05 08:00:00
      '09:00', // 2019-09-05 09:00:00
      '10:00', // ...
      '11:00',
      '12:00',
      '13:00',
      '14:00',
      '15:00',
      '16:00',
      '17:00',
      '18:00',
      '19:00',
    ];

    // objeto que vai retornar as datas disponíveis para o usuario
    const available = schedule.map(time => {
      // antes de ":" hour :: Apos ":" minute (no array time):
      const [hour, minute] = time.split(':');
      // seta segundos como 00 :: seta minutos :: seta a hora recebida
      const value = setSeconds(
        setMinutes(setHours(searchDate, hour), minute),
        0
      ); // 2019-09-05 08:00:00

      return {
        time, // 08:00
        // format do date-fns:
        value: format(value, "yyyy-MM-dd'T'HH:mm:ssxxx"), // "2019-09-05T10:00:00-03:00"
        available:
          // verifica se a data recebida e depois da data atual
          isAfter(value, new Date()) &&
          // verifica se o horario ja esta agendado (se nao esta contido no const appointments)
          !appointments.find(a => format(a.date, 'HH:mm') === time),
      };
    });

    return res.json(available);
  }
}

export default new AvailableController();
