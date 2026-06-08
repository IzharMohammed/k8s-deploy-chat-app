import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Histogram, Counter } from 'prom-client';
import { InjectMetric } from '@willsoto/nestjs-prometheus';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(
    @InjectMetric('http_requests_duration_seconds')
    private readonly histogram: Histogram<string>,
    @InjectMetric('http_requests_total')
    private readonly counter: Counter<string>,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const { method, url } = req;
    
    // Start the timer
    const endTimer = this.histogram.startTimer({ method, route: url });

    return next.handle().pipe(
      tap({
        next: () => {
          const res = context.switchToHttp().getResponse();
          const status = res.statusCode;
          this.counter.inc({ method, route: url, status });
          endTimer({ status });
        },
        error: (error) => {
          const status = error.status || 500;
          this.counter.inc({ method, route: url, status });
          endTimer({ status });
        },
      }),
    );
  }
}
