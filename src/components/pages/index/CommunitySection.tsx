// "use client";

// import React, { useState, useEffect } from "react";
// import styled from "styled-components";
// import Image from "next/image";
// // import { Socials } from '@/components/Socials';
// import InfoCard from "@/components/cards/InfoCard";

// // (Removed unused GitHubRepo and GitHubUser interfaces)

// interface GitHubStats {
//   collaborators: string;
//   commits: string;
//   loading: boolean;
//   error: string | null;
// }

// // (Removed unused GitHubData interface)

// interface GitHubEvent {
//   type: string;
//   actor?: {
//     login: string;
//   };
// }

// // Revisar Width, Height para hacerlo responsive
// // Cambiar colores por los colores estandar
// const SectionWrapper = styled.section`
//   width: 100%;
//   padding: 80px 24px;
//   background: color-mix(
//     in oklab,
//     var(--google-super-light-gray, #f8f9fa) 88%,
//     var(--google-yellow, #fbbc05)
//   );
// `;

// const SectionContainer = styled.div`
//   max-width: 1200px;
//   margin: 0 auto;
// `;

// const SectionHeader = styled.div`
//   text-align: center;
//   margin-bottom: 48px;

//   h2 {
//     font-size: 2.5rem;
//     font-weight: 700;
//     color: var(--footer-title-text);
//     margin: 0 0 16px 0;
//   }

//   p {
//     font-size: 1.2rem;
//     color: var(--google-light-gray);
//     max-width: 650px;
//     margin: 0 auto;
//     line-height: 1.6;
//   }
// `;

// const WidgetGrid = styled.div`
//   display: grid;
//   grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
//   gap: 24px;
// `;

// // Reutilizamos InfoCard como base visual de los widgets
// const WidgetCard = styled(InfoCard)``;

// const WidgetHeader = styled.div`
//   display: flex;
//   align-items: flex-start;
//   gap: 12px;
//   margin-bottom: 12px;

//   h3 {
//     font-size: 1.4rem;
//     font-weight: 600;
//     color: var(--footer-title-text);
//     margin: 0;
//   }
// `;

// const WidgetIcon = styled.div<{ $color?: string }>`
//   display: flex;
//   align-items: center;
//   justify-content: center;
//   width: 32px;
//   height: 32px;
//   color: ${({ $color }) => $color || "var(--footer-title-text)"};

//   svg {
//     width: 24px;
//     height: 24px;
//     fill: currentColor;
//   }

//   img {
//     width: 24px;
//     height: 24px;
//     object-fit: contain;
//     display: block;
//   }
// `;

// const WidgetDescription = styled.p`
//   font-size: 1rem;
//   color: var(--google-light-gray);
//   line-height: 1.6;
//   margin: 0;
//   flex-grow: 1; // Empuja el botón hacia abajo
// `;

// const WidgetFooter = styled.div`
//   margin-top: 24px;
// `;

// // Botón genérico para los widgets
// const WidgetButton = styled.a<{ $brandColor?: string }>`
//   display: inline-flex;
//   align-items: center;
//   justify-content: center;
//   gap: 8px;
//   padding: 10px 20px;
//   background-color: ${({ $brandColor }) => $brandColor || "var(--google-yellow)"};
//   color: var(--color-white);
//   text-decoration: none;
//   border-radius: 8px;
//   font-weight: 500;
//   transition:
//     transform 0.2s ease,
//     box-shadow 0.2s ease;

//   &:hover {
//     transform: translateY(-2px);
//     background-color: color-mix(
//       in srgb,
//       ${({ $brandColor }) => $brandColor || "var(--google-yellow)"} 85%,
//       white 15%
//     );
//     box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
//   }
// `;

// // Componentes específicos para GitHub
// const GitHubStatsGrid = styled.div`
//   display: grid;
//   grid-template-columns: 1fr 1fr;
//   gap: 16px;
//   margin: 24px 0;
// `;

// const StatItem = styled.div`
//   text-align: center;
//   padding: 12px;
//   background: var(--color-gray-100);
//   border-radius: 12px;
// `;

// const StatNumber = styled.div`
//   font-size: 1.7rem;
//   font-weight: 700;
//   color: var(--footer-title-text);
// `;

// const StatLabel = styled.div`
//   font-size: 0.8rem;
//   color: var(--google-light-gray);
//   font-weight: 400;
//   text-transform: uppercase;
//   letter-spacing: 0.5px;
// `;

// const LoadingSpinner = styled.div`
//   // Estilos del spinner con variables
//   display: inline-block;
//   width: 20px;
//   height: 20px;
//   border: 2px solid var(--spinner-border-color);
//   border-radius: 50%;
//   border-top-color: var(--spinner-border-top-color);
//   animation: spin 1s ease-in-out infinite;

//   @keyframes spin {
//     to {
//       transform: rotate(360deg);
//     }
//   }
// `;

// const COMMUNITY_URL =
//   process.env.NEXT_PUBLIC_COMMUNITY_URL ??
//   "https://gdg.community.dev/gdg-on-campus-autonomous-university-of-madrid-madrid-spain/";

// // --- COMPONENTE PRINCIPAL REDISEÑADO ---

// const CommunitySection = () => {
//   const [githubStats, setGithubStats] = useState<GitHubStats>({
//     collaborators: "0",
//     commits: "0",
//     loading: true,
//     error: null
//   });

//   // La lógica de fetchGitHubData se mantiene igual.
//   const fetchGitHubData = async () => {
//     try {
//       setGithubStats((prev) => ({ ...prev, loading: true, error: null }));

//       const orgResponse = await fetch("https://api.github.com/orgs/GDG-UAM");
//       if (!orgResponse.ok) {
//         throw new Error("Error al obtener datos de la organización");
//       }

//       const reposResponse = await fetch(
//         "https://api.github.com/orgs/GDG-UAM/repos?sort=updated&per_page=10"
//       );
//       if (!reposResponse.ok) {
//         throw new Error("Error al obtener repositorios");
//       }

//       const contributorsSet = new Set<string>();
//       let totalCommits = 0;

//       try {
//         const eventsResponse = await fetch(
//           "https://api.github.com/orgs/GDG-UAM/events?per_page=100"
//         );
//         if (eventsResponse.ok) {
//           const eventsData: GitHubEvent[] = await eventsResponse.json();
//           totalCommits =
//             eventsData.filter((event: GitHubEvent) => event.type === "PushEvent").length * 3;

//           eventsData.forEach((event: GitHubEvent) => {
//             if (event.actor?.login) {
//               contributorsSet.add(event.actor.login);
//             }
//           });
//         }
//       } catch (error) {
//         console.warn("Error al obtener eventos:", error);
//       }

//       setGithubStats({
//         collaborators: Math.max(contributorsSet.size, 8).toString(),
//         commits: totalCommits > 0 ? `${totalCommits}+` : "200+",
//         loading: false,
//         error: null
//       });
//     } catch (error) {
//       console.error("Error fetching GitHub data:", error);
//       setGithubStats((prev) => ({
//         ...prev,
//         loading: false,
//         error: error instanceof Error ? error.message : "Error desconocido"
//       }));
//     }
//   };

//   useEffect(() => {
//     fetchGitHubData();
//   }, []);

//   return (
//     <SectionWrapper>
//       <SectionContainer>
//         <SectionHeader>
//           <h2>Únete a la Comunidad</h2>
//           <p>
//             Somos un grupo de entusiastas de la tecnología. Conecta, colabora y aprende con nosotros
//             a través de nuestras diferentes plataformas.
//           </p>
//         </SectionHeader>

//         <WidgetGrid>
//           {/* Widget de GitHub */}
//           <WidgetCard color={"var(--color-black)"}>
//             <WidgetHeader>
//               <WidgetIcon $color={"var(--footer-title-text)"}>
//                 <svg viewBox="0 0 24 24">
//                   <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
//                 </svg>
//               </WidgetIcon>
//               <h3>Open Source en GitHub</h3>
//             </WidgetHeader>
//             <WidgetDescription>
//               Explora nuestros proyectos, contribuye con código y aprende de nuestro trabajo.
//             </WidgetDescription>
//             <GitHubStatsGrid>
//               {githubStats.loading ? (
//                 <LoadingSpinner style={{ margin: "20px auto", gridColumn: "1 / -1" }} />
//               ) : (
//                 <>
//                   <StatItem>
//                     <StatNumber>{githubStats.collaborators}</StatNumber>
//                     <StatLabel>Colaboradores</StatLabel>
//                   </StatItem>
//                   <StatItem>
//                     <StatNumber>{githubStats.commits}</StatNumber>
//                     <StatLabel>Commits</StatLabel>
//                   </StatItem>
//                 </>
//               )}
//             </GitHubStatsGrid>
//             <WidgetFooter>
//               <WidgetButton
//                 href="https://github.com/GDG-UAM"
//                 target="_blank"
//                 rel="noopener noreferrer"
//                 $brandColor="var(--google-yellow)"
//               >
//                 Ir a GitHub
//               </WidgetButton>
//             </WidgetFooter>
//           </WidgetCard>

//           {/* Widget de Comunidad (gdg.community.dev) */}
//           <WidgetCard color={"var(--google-blue)"}>
//             <WidgetHeader>
//               <WidgetIcon $color={"var(--google-blue)"}>
//                 <Image src="/logo/32x32.webp" alt="GDGoC UAM" width={24} height={24} />
//               </WidgetIcon>
//               <h3>Únete a nuestra comunidad</h3>
//             </WidgetHeader>
//             <WidgetDescription>
//               Forma parte de nuestro capítulo en el ecosistema GDG: apúntate a eventos, recibe
//               avisos y colabora con la comunidad.
//             </WidgetDescription>
//             <WidgetFooter>
//               <WidgetButton
//                 href={COMMUNITY_URL}
//                 target="_blank"
//                 rel="noopener noreferrer"
//                 $brandColor="var(--google-blue)"
//               >
//                 Unirse a GDG
//               </WidgetButton>
//             </WidgetFooter>
//           </WidgetCard>

//           {/* Widget de WhatsApp */}
//           <WidgetCard color={"var(--button-whatsapp-hover-text)"}>
//             <WidgetHeader>
//               <WidgetIcon $color={"var(--button-whatsapp-hover-text)"}>
//                 <svg viewBox="0 0 24 24">
//                   <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0 0020.885 3.488" />
//                 </svg>
//               </WidgetIcon>
//               <h3>Canal de WhatsApp</h3>
//             </WidgetHeader>
//             <WidgetDescription>
//               Recibe notificaciones de eventos, anuncios importantes y enlaces de interés
//               directamente en tu móvil.
//             </WidgetDescription>
//             <WidgetFooter>
//               <WidgetButton
//                 href="#"
//                 target="_blank"
//                 rel="noopener noreferrer"
//                 $brandColor="var(--button-whatsapp-hover-text)"
//               >
//                 Unirse al Canal
//               </WidgetButton>
//             </WidgetFooter>
//           </WidgetCard>
//         </WidgetGrid>
//       </SectionContainer>
//     </SectionWrapper>
//   );
// };

// export default CommunitySection;
