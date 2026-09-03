import { useT } from '../lib/i18n';

const COUNT = 11;

/**
 * Answers to the questions a finance or accounting team asks before it will
 * put a tool in front of its own numbers -- where the data goes, what file it
 * accepts, why a row was left out, whether it talks to the ERP. Native
 * <details> elements keep it collapsed by default, keyboard-operable and
 * searchable by the browser's own find, with no state to manage.
 */
export function Faq() {
  const t = useT();

  return (
    <section className="faq" id="faq">
      <h2 className="faq__title">{t('faq.title')}</h2>
      <p className="faq__subtitle">{t('faq.subtitle')}</p>
      <div className="faq__list">
        {Array.from({ length: COUNT }, (_, i) => i + 1).map((n) => (
          <details key={n} className="faq__item">
            <summary className="faq__question">{t(`faq.q${n}`)}</summary>
            <p className="faq__answer">{t(`faq.a${n}`)}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
