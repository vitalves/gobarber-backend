// para envio de email:
import nodemailer from 'nodemailer';
// Para trab com diretorio dos templates de email:
import { resolve } from 'path';
// para templates de email:
import exphbs from 'express-handlebars';
import nodemailerhbs from 'nodemailer-express-handlebars';
// configs de email
import mailConfig from '../config/mail';

class Mail {
  constructor() {
    const { host, post, secure, auth } = mailConfig;

    this.transporter = nodemailer.createTransport({
      host,
      post,
      secure,
      auth: auth.user ? auth : null,
    });

    // template:
    this.configureTemplates();
  }

  // configuracoes do template de email:
  configureTemplates() {
    // pasta com as views
    const viewPath = resolve(__dirname, '..', 'app', 'views', 'emails');

    this.transporter.use(
      'compile',
      nodemailerhbs({
        viewEngine: exphbs.create({
          layoutsDir: resolve(viewPath, 'layouts'), // diretorio de layouts
          partialsDir: resolve(viewPath, 'partials'), // dir partials
          // layout padrao:
          defaultLayout: 'default',
          // extensao do arquivo
          extname: '.hbs', // se nao for definido recebe .handlebars
        }),
        viewPath,
        extName: '.hbs', // se nao for definido recebe .handlebars
      })
    );
  }

  // metodo que faz o envio de email
  sendMail(message) {
    return this.transporter.sendMail({
      ...mailConfig.default,
      ...message,
    });
  }
}

export default new Mail();
