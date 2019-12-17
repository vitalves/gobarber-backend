import * as Yup from 'yup'; // para validacao
import { startOfHour, parseISO, isBefore, format, subHours } from 'date-fns'; // para datas
import pt from 'date-fns/locale/pt'; // Formata data para Portugues (tem pt-br)
import User from '../models/User';
import File from '../models/File';
import Appointment from '../models/Appointment';
import Notification from '../schemas/Notification'; // Schema Mongoose

// importa a JOB de cancelamento (Envio de email):
import CancellationMail from '../jobs/CancellationMail';

// envia email
// import Mail from '../../lib/Mail'; (nao necessario com a inclusao da Queue)
// importa a fila para o envio de emails em background
import Queue from '../../lib/Queue';

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
    const schema = Yup.object().shape({
      provider_id: Yup.number().required(),
      date: Yup.date().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Falha na validacao dos dados' });
    }

    const { provider_id, date } = req.body;

    // verifica se o usuario tenat agendar com ele mesmo
    if (provider_id === req.userId) {
      return res
        .status(401)
        .json({ error: 'Nao e possivel agendar com si mesmo' });
    }

    // verifica se o provider_is é um provedor de serviços
    const isProvider = await User.findOne({
      where: { id: provider_id, provider: true },
    });

    if (!isProvider) {
      return res
        .status(401)
        .json({ error: 'voce nao pode marcar esse servico ' });
    }

    // VERIFICACOES DE DATA E HORA:

    // pega a hora sem mins e segs
    const hourStart = startOfHour(parseISO(date));

    // verifica se a data passada é anterior a atual
    if (isBefore(hourStart, new Date())) {
      return res.status(400).json({ error: 'Data anterior nao permitida ' });
    }

    // verifica se a dada esta disponivel
    const checkAvailability = await Appointment.findOne({
      where: {
        provider_id,
        canceled_at: null,
        date: hourStart,
      },
    });

    if (checkAvailability) {
      return res.status(400).json({ error: 'Data nao disponivel ' });
    }
    // FIM VERIFICACOES DE DATA E HORA

    // Criar no banco de dados
    const appointment = await Appointment.create({
      user_id: req.userId, // userId é setado no middleware de autenticacao
      provider_id,
      date,
    });

    // NOTIFICAR AGENDAMENTO (Usando os Schemas do Mongoose/Mongo)
    // Busca no BD o usuario
    const user = await User.findByPk(req.userId);
    // Forma a data
    const formattedDate = format(
      hourStart,
      "'dia' dd 'de' MMMM', as' H:mm'h'",
      { locale: pt }
    );

    await Notification.create({
      content: `Novo agendamento de ${user.name} para ${formattedDate}`,
      user: provider_id,
      // read: nao precisa por tem padrao de FALSE
    });
    // FIM NOTIFICAR AGENDAMENTO (Usando os Schemas do Mongoose/Mongo)

    return res.json(appointment);
  }

  // Apaga agendamentos (cancelamento)
  async delete(req, res) {
    // buscar os dados do agendamento (include no User provider para o envio de email)
    const appointment = await Appointment.findByPk(req.params.id, {
      include: [
        // usuario prestador de servico:
        {
          model: User,
          as: 'provider',
          attributes: ['name', 'email'],
        },
        // usuario comum para enviar o nome no email:
        {
          model: User,
          as: 'user',
          attributes: ['name'],
        },
      ],
    });

    // verifica se o usuario logado e 'dono' do agendamento
    if (appointment.user_id !== req.userId) {
      return res.status(400).json({
        error: 'Você não tem permissao para cancelar esse agendamento',
      });
    }

    // subHours - Subtrai horas
    const dateWithSub = subHours(appointment.date, 2); // subtrai 2h da data agendada

    // verifica se a hora subtraida eh anterior a hora atual
    if (isBefore(dateWithSub, new Date())) {
      return res.status(401).json({
        error:
          'Voce so pode cancelar agendamentos com mais de 2 horas de antecedecia',
      });
    }

    // Se OK: Insere a data atual no campo 'canceled_at'
    appointment.canceled_at = new Date();

    // salva no banco a agendamento completo com a alteracao
    await appointment.save();

    // envia um email ao pretador de servco
    /*
     * PECULIARIDADES SOBRE O ENVIO DE EMAILS:
     * COM 'await': await Mail.sendMail({: a return aguarda o envio do email (+ lento)
     * SEM 'await': Mail.sendMail({: a return e imediato, mas sem resposta de sucesso ou de falha
      await Mail.sendMail({
        to: `${appointment.provider.name} <${appointment.provider.email}>`,
        subject: 'Agendamento cancelado',
        // text: 'atenção! Você tem um novo cancelamento!?', // MODO S/ TEMPLATE
        // Inclui template no email:
        template: 'cancellation', // sem a extensao
        // variaves enviadas ao template:
        context: {
          provider: appointment.provider.name,
          user: appointment.user.name,
          date: format(appointment.date, "'dia' dd 'de' MMMM', as' H:mm'h'", {
            locale: pt,
          }),
        },
      });
     */

    /*
     * Para o envio em backgroung usa-se um banco CHAVE:VALOR (Redis)
     *
     */

    // envia um email ao pretador de servco (ENVIA PARA A FILA - Queue -):
    await Queue.add(CancellationMail.key, {
      // dados do email:
      appointment,
      // teste: 'teste'
    });

    // retorna os dados atualizados
    return res.json(appointment);
  }
}

export default new AppointmentController();
