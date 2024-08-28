import "@mantine/core/styles.css";
import React from "react";
import { AppShell, Burger, Group, Image, MantineProvider } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import theme from "./theme.js";

import logoUrl from "@batijs/react/assets/logo.svg";
import { Link } from "../components/Link";

export default function LayoutDefault({ children }: { children: React.ReactNode }) {
  const [opened, { toggle }] = useDisclosure();
  return (
    <MantineProvider theme={theme}>
      <AppShell
        header={{ height: 60 }}
        navbar={{ width: 300, breakpoint: "sm", collapsed: { mobile: !opened } }}
        padding="md"
      >
        <AppShell.Header>
          <Group h="100%" px="md">
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <a href="/">
              {" "}
              <Image h={50} fit="contain" src={logoUrl} />{" "}
            </a>
          </Group>
        </AppShell.Header>
        <AppShell.Navbar p="md">
          <Link href="/" label="Welcome" />
          <Link href="/todo" label="Todo" />
          <Link href="/star-wars" label="Data Fetching" />
        </AppShell.Navbar>
        <AppShell.Main> {children} </AppShell.Main>
      </AppShell>
    </MantineProvider>
  );
}
