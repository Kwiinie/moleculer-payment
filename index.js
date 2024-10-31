import { ServiceBroker } from 'moleculer';
import config from './moleculer.config.js';
import TransactionService from './services/transaction.service.js';
import ApiService from './services/api.service.js';
import ZalopayService from './services/zalopay.service.js';
import MomoService from './services/momo.service.js';

const broker = new ServiceBroker({
    ...config,
    validator: true,
    hotReload: true
});

broker.createService(TransactionService);
broker.createService(ApiService);
broker.createService(ZalopayService);
broker.createService(MomoService);


broker.start().then(() => {
    broker.repl();
    console.log('This project is running on http://localhost:' + process.env.PORT);
});
