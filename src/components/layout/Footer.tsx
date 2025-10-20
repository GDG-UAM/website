"use client";

import styled from "styled-components";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Socials } from "../Socials";
// import Socials from "@/components/Socials";

const FooterWrapper = styled.footer`
  background: var(--footer-bg);
  border-top: 1px solid var(--footer-wrapper-border-top);
  box-shadow: 0 -1px 2px var(--footer-wrapper-shadow);
  padding: 10px 20px 12px;
  color: var(--footer-text);
  margin-top: auto;
`;

const Inner = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column-reverse;
  gap: 30px;

  @media (min-width: 768px) {
    flex-direction: row;
    justify-content: space-between;
    gap: 40px;
  }
`;

const DisclaimerSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;

  @media (min-width: 768px) {
    flex: 2;
    max-width: 400px;
  }
`;

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;

  @media (min-width: 768px) {
    flex: 1;
  }
`;

const Title = styled.h4`
  font-size: 1rem;
  font-weight: 600;
  color: var(--footer-title-text);
  margin-bottom: 0;
`;

const LinkList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const FooterLink = styled(Link)`
  color: var(--footer-link-text);
  text-decoration: none;
  font-size: 0.95rem;

  &:hover {
    text-decoration: underline;
  }
`;

const Disclaimer = styled.p`
  font-size: 0.85rem;
  color: var(--footer-disclaimer-text);
  line-height: 1.4;
  margin: 0;
`;

const Copyright = styled.div`
  text-align: center;
  padding-top: 12px;
  margin: 12px 10% 0;
  border-top: 2px solid var(--footer-copyright-border-top);
  font-size: 0.85rem;
  color: var(--footer-copyright-text);
`;

export default function Footer() {
  const t = useTranslations("footer");
  const currentYear = new Date().getFullYear();

  return (
    <FooterWrapper>
      <Inner>
        <DisclaimerSection>
          <Title>{t("disclaimer.title")}</Title>
          <Disclaimer>
            {t.rich("disclaimer.text", {
              link: () => (
                <a
                  href="https://developers.google.com/community/gdg"
                  target="_blank"
                  rel="noopener noreferrer"
                  data-no-ai-translate
                  className="intext"
                  style={{ lineBreak: "anywhere" }}
                >
                  https://developers.google.com/community/gdg
                </a>
              )
            })}
          </Disclaimer>
        </DisclaimerSection>

        <Section>
          <Title>{t("quickLinks")}</Title>
          <LinkList>
            <li>
              <FooterLink href="/about">{t("about")}</FooterLink>
            </li>
            <li>
              <FooterLink href="/blog">{t("blog")}</FooterLink>
            </li>
            <li>
              <FooterLink href="/events">{t("events")}</FooterLink>
            </li>
            <li>
              <FooterLink href="/contact">{t("contact")}</FooterLink>
            </li>
            <li>
              <FooterLink href="/blog/privacy">{t("privacy")}</FooterLink>
            </li>
          </LinkList>
        </Section>

        <Section>
          <Title>{t("connectWithUs")}</Title>
          <Socials></Socials>
        </Section>
      </Inner>

      <Copyright>
        <div style={{ marginTop: 0, marginBottom: 0 }}>
          {t.rich("credits", {
            hector: (chunks) => (
              <Link
                className="intext"
                data-no-ai-translate
                href="https://gdguam.es/l/hector-tablero"
              >
                {chunks}
              </Link>
            ),
            jose: (chunks) => (
              <Link
                className="intext"
                data-no-ai-translate
                href="https://gdguam.es/l/jose-arbelaez"
              >
                {chunks}
              </Link>
            )
          })}
        </div>
        {t.rich("copyright", {
          year: currentYear,
          noTranslate: (chunk) => <span data-no-ai-translate>{chunk}</span>
        })}
      </Copyright>
    </FooterWrapper>
  );
}
