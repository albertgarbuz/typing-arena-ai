import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export default function NotFound() {
  return <><SiteHeader /><main id="main-content" className="document-page"><div className="container document-shell"><p className="eyebrow">404 · ВНЕ МАРШРУТА</p><h1 className="document-title">Такой страницы пока нет.</h1><p className="document-lead">Вернитесь на главную или посмотрите, какие разделы появятся на следующих этапах.</p><div className="button-row"><Link className="button button-primary" href="/">На главную</Link><Link className="button button-secondary" href="/roadmap">План разработки</Link></div></div></main><SiteFooter /></>;
}
