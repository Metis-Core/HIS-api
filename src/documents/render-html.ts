import { Logger } from '@nestjs/common';
import mjml2html from 'mjml';
import { printAutoTriggerScript } from './templates/shared';

const logger = new Logger('DocumentRenderer');

/** MJML to a standalone HTML page, optionally printing itself on load. */
export async function renderHtml(
  mjml: string,
  opts: { autoPrint?: boolean } = {},
): Promise<string> {
  const result = await mjml2html(mjml, {
    validationLevel: 'soft',
    keepComments: false,
  });
  if (result.errors && result.errors.length > 0) {
    logger.warn(
      `MJML validation warnings: ${result.errors.map((e) => e.formattedMessage).join('; ')}`,
    );
  }
  return opts.autoPrint
    ? result.html.replace('</body>', `${printAutoTriggerScript()}</body>`)
    : result.html;
}
