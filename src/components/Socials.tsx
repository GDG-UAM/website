import { OpenSocialButton } from "./Buttons";
import styled from "styled-components";

const SocialsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
`;

export const Socials: React.FC = () => {
  return (
    <SocialsContainer>
      <OpenSocialButton
        network="instagram"
        user="https://gdguam.es/l/instagram"
        ignoreStart
        dontUseContext
      />
      <OpenSocialButton
        network="linkedinCompany"
        user="https://gdguam.es/l/linkedin"
        ignoreStart
        dontUseContext
      />
      <OpenSocialButton
        network="whatsapp"
        user="https://gdguam.es/l/whatsapp"
        ignoreStart
        dontUseContext
      />
      <OpenSocialButton network="email" user="gdguam@gmail.com" dontUseContext />
      <OpenSocialButton
        network="gdgCommunity"
        user="https://gdguam.es/l/gdg-community"
        ignoreStart
        dontUseContext
      />
    </SocialsContainer>
  );
};
