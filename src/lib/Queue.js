import Bee from 'bee-queue';
// importa a configuracao de concexao do REDIS DB
import redisConfig from '../config/redis';

// IMPORTA-SE TODOS OS JOBS: ../app/jobs/...
import CancellationMail from '../app/jobs/CancellationMail';

// COLOCA-SE TODOS OS JOBS NO ARRAY (da mesma forma que no lodding de Model database/index.js)
const jobs = [CancellationMail];
// a cada novo JOB importa-se e colca no array acima

class Queue {
  constructor() {
    // aqui dentro tera varias filas (queue)
    // (cada trabalho (jobs) tera sua propria fila)
    this.queues = {};
    // todos os Jobs da aplicacao serao armazenados dentro da 'queues' acima

    this.init();
  }

  // parte de inicicializacao das filas:
  init() {
    // percorrer o jobs
    jobs.forEach(({ key, handle }) => {
      // configuracoes:
      this.queues[key] = {
        bee: new Bee(key, {
          redis: redisConfig, // importada de ../config/redis'
        }),
        handle, // metodo que processa o Job (executa as tarefas)
      };
    });
  }

  // Metodo pra adicionar novos trabalhos dentro de cada fila
  add(queue, job) {
    return this.queues[queue].bee.createJob(job).save();
  }

  // metodo que processa as filas
  processQueue() {
    // percorre cada um do Jobs
    jobs.forEach(job => {
      // buscar o bee e o handle da fila relacionada ao Jobs:
      const { bee, handle } = this.queues[job.key];
      // processa: // on('event'):: ouve eventos: error, succeeded, failed...
      bee.on('failed', this.handleFailure).process(handle);
    });
  }

  // metodo usado para tratar o evento 'failed' :: on('failed')
  handleFailure(job, err) {
    console.log(`Queue ${job.queue.name}: FAILED`, err);
  }
}

export default new Queue();
