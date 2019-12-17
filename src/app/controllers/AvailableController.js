import AvailableService from '../services/AvailableService';

class AvailableController {
  async index(req, res) {
    const { date } = req.query; // new Date().getTime() :: timestamp 1567701796781

    // verifica se a data e informada
    if (!date) {
      return res.status(400).json({ error: 'Data invalida' });
    }

    // garantir que a data seja um numero Inteiro
    const searchDate = Number(date); // 2019-09-05 15:11:25

    const available = await AvailableService.run({
      date: searchDate,
      provider_id: req.params.providerId,
    });

    return res.json(available);
  }
}

export default new AvailableController();
