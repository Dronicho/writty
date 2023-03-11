// import { Request, Response, NextFunction } from 'express';
// import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
// import { AppLogger } from '../logger/logger.service';
// import { createRequestContext } from '../request-context/util';

// @Injectable()
// export class LoggerMiddleware implements NestMiddleware {
//   constructor(private readonly logger: AppLogger) {}

//   use(request: Request, response: Response, next: NextFunction): void {
//     const startAt = process.hrtime();
//     const { method } = request;
//     // const userAgent = request.get('user-agent') || '';

//     response.on('finish', () => {
//       const { statusCode } = response;
//       const contentLength = response.get('content-length');
//       const diff = process.hrtime(startAt);
//       let responseTime = diff[0] * 1e3 + diff[1] * 1e-6;

//       const resData = { method, statusCode, responseTime };

//       this.logger.log(createRequestContext(request), 'Request completed', {
//         resData,
//       });
//     });

//     let send = response.send;
//     response.send = (exitData) => {
//       if (
//         response
//           ?.getHeader('content-type')
//           ?.toString()
//           .includes('application/json')
//       ) {
//         console.log({
//           code: response.statusCode,
//           exit: exitData.toString().substring(0, 1000),
//           endDate: new Date(),
//         });
//       }
//       response.send = send;
//       return res.send(exitData);
//     };

//     next();
//   }
// }
