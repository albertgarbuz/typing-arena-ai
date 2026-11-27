import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

const issueForm = "https://github.com/albertgarbuz/typing-arena-ai/issues/new?" + new URLSearchParams({
  title: "Проблема на сайте",
  body: "Страница или урок:\nБраузер и устройство:\nЧто произошло:\nЧто должно было произойти:\n",
});

export default function SupportPage() {
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="layout-container public-card">
        <section className="campaign-board">
          <h1>Техподдержка</h1>
          <p>Если пропал прогресс или возникла ошибка, напишите, на какой странице это произошло и что вы делали перед этим.</p>
          <p>Запрос будет публичным и потребует входа в аккаунт GitHub. Не указывайте почту, пароли и другие личные данные.</p>
          <a href={issueForm} className="button button--primary">Создать запрос</a>
          <p><Link href="/learn" className="text-link">Вернуться к обучению</Link></p>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
