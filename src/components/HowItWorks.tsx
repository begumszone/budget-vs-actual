import { useT } from '../lib/i18n';

const STEPS = [1, 2, 3, 4, 5, 6];
const FORMULAS = [1, 2, 3];
const LIMITS = [1, 2, 3, 4, 5];

/**
 * The method, written down.
 *
 * Someone is going to be asked "where did this number come from?" -- by an
 * auditor, a manager, or their own doubt at eleven at night. Answering that
 * from the source code is not a reasonable thing to expect, so the route a
 * file takes, the arithmetic applied to it, and the things the tool refuses
 * to do are all stated on the page itself. The last of those three matters
 * most: a tool that is honest about its limits can be trusted on the rest.
 */
export function HowItWorks() {
  const t = useT();

  return (
    <section className="how" id="how-it-works">
      <h2 className="how__title">{t('how.title')}</h2>
      <p className="how__subtitle">{t('how.subtitle')}</p>

      <h3 className="how__heading">{t('how.pipeline')}</h3>
      <ol className="how__steps">
        {STEPS.map((n) => (
          <li key={n} className="how__step">
            <span className="how__marker" aria-hidden="true">
              {n}
            </span>
            <div>
              <span className="how__step-title">{t(`how.s${n}.title`)}</span>
              <p className="how__step-body">{t(`how.s${n}.body`)}</p>
            </div>
          </li>
        ))}
      </ol>

      <h3 className="how__heading">{t('how.maths')}</h3>
      <dl className="how__formulas">
        {FORMULAS.map((n) => (
          <div key={n} className="how__formula">
            <dt className="how__formula-label">{t(`how.m${n}.label`)}</dt>
            <dd>
              {/* The formulas are the one place a fixed-width face earns its
                  keep: the operands line up, and the FX block is three
                  equations that have to be read against each other. */}
              <pre className="how__formula-code">{t(`how.m${n}.formula`)}</pre>
              <p className="how__formula-note">{t(`how.m${n}.note`)}</p>
            </dd>
          </div>
        ))}
      </dl>

      <h3 className="how__heading">{t('how.limits')}</h3>
      <ul className="how__limits">
        {LIMITS.map((n) => (
          <li key={n}>{t(`how.l${n}`)}</li>
        ))}
      </ul>
    </section>
  );
}
