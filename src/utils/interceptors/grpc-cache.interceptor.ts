import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, of, tap } from 'rxjs';
import { Reflector } from '@nestjs/core';
import { CACHE_MANAGER, CACHE_TTL_METADATA } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';

@Injectable()
export class GrpcCacheInterceptor implements NestInterceptor {
  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly reflector: Reflector,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<unknown>> {
    const rpcContext = context.switchToRpc();
    const handler = context.getHandler();
    const className = context.getClass().name;
    const methodName = handler.name;
    const data: unknown = rpcContext.getData();

    const cacheKey = `grpc:${className}:${methodName}:${JSON.stringify(data)}`;

    const ttl = this.reflector.get<number>(CACHE_TTL_METADATA, handler);
    if (!ttl) {
      return next.handle();
    }

    const cachedResult = await this.cacheManager.get(cacheKey);
    if (cachedResult) {
      return of(cachedResult);
    }

    return next.handle().pipe(
      tap((response) => {
        void this.cacheManager.set(cacheKey, response, ttl);
      }),
    );
  }
}
