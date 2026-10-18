import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Observable } from 'rxjs';
import type { AuthenticatedUser } from 'common/interfaces/authenticated-user.interface';
import { RequestContext } from './request-context';

// Runs after the auth guards, so the authenticated user is known here.
@Injectable()
export class RequestContextInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context
      .switchToHttp()
      .getRequest<{ user?: AuthenticatedUser }>();
    RequestContext.setCurrentUserId(request.user?.id);
    return next.handle();
  }
}
