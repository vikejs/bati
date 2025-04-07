import { usePageContext } from "vike-react/usePageContext";
import { NavLink } from "@mantine/core";

export function Link({ href, label }: { href: string; label: string }) {
  const pageContext = usePageContext();
  const { urlPathname } = pageContext;
  const isActive = href === "/" ? urlPathname === href : urlPathname.startsWith(href);
  return <NavLink href={href} label={label} active={isActive} />;
}
