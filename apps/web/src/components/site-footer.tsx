import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner layout-container">
        <div className="site-footer__brand">
          <span className="brand__mark brand__mark--small" aria-hidden="true">
            TA
          </span>
          <div className="site-footer__about">
            <p className="site-footer__name">Typing Arena AI</p>
            <p className="site-footer__tagline">
              Спортивная платформа слепой печати: 100 пошаговых уроков, AI-тренер,
              спортивная система рейтингов Elo, командные заезды 2 на 2 и еженедельные турниры.
            </p>
          </div>
        </div>

        <nav className="site-footer__nav" aria-label="Разделы платформы">
          <ul className="site-footer__links">
            <li className="site-footer__item">
              <Link className="site-footer__link" href="/learn">
                100 уроков
              </Link>
            </li>
            <li className="site-footer__item">
              <Link className="site-footer__link" href="/arena">
                Клавогоночная Арена
              </Link>
            </li>
            <li className="site-footer__item">
              <Link className="site-footer__link" href="/profile">
                Личный кабинет
              </Link>
            </li>
            <li className="site-footer__item">
              <Link className="site-footer__link" href="/methodology">
                Методика расчёта
              </Link>
            </li>
            <li className="site-footer__item">
              <Link className="site-footer__link" href="/support">
                Техподдержка
              </Link>
            </li>
            <li className="site-footer__item">
              <Link className="site-footer__link site-footer__link--legal" href="/legal">
                Оферта и ПДн (152-ФЗ)
              </Link>
            </li>
          </ul>
        </nav>

        <p className="site-footer__copyright">
          © {new Date().getFullYear()} Typing Arena AI. Все права защищены. Обработка персональных данных осуществляется в соответствии с 152-ФЗ РФ.
        </p>
      </div>
    </footer>
  );
}

export default SiteFooter;
