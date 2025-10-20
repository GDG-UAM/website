import styled, { keyframes } from "styled-components";

export const PageWrapper = styled.div`
  padding: 40px 32px 80px;
  max-width: 1280px;
  margin: 0 auto;
`;

export const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
`;

export const Title = styled.h1`
  font-size: 2rem;
  font-weight: 800;
  margin: 0;
`;

export const Filters = styled.div`
  display: flex;
  gap: 10px;
`;

export const FilterButton = styled.button<{ $active: boolean }>`
  background: transparent;
  color: ${({ $active }) => ($active ? "var(--google-blue)" : "var(--google-light-gray)")};
  border: 1px solid ${({ $active }) => ($active ? "var(--google-blue)" : "var(--color-gray-300)")};
  border-radius: 9.5px;
  padding: 10px 20px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  position: relative;
  transition: all 0.3s ease;
  overflow: hidden;
`;

export const EventsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(275px, 1fr));
  gap: 32px;
  margin-top: 32px;
`;

const slideUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

export const EventCard = styled.div`
  background-color: var(--color-white);
  border-radius: 8px;
  transition:
    background-color 0.25s cubic-bezier(0.4, 0, 0.2, 1),
    box-shadow 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  max-width: 350px;
  min-width: 275px;
  height: 100%;
  animation: ${slideUp} 0.4s ease-out;
  cursor: pointer;
  position: relative;
  padding: 0;
  margin: auto;
  border: 1px var(--color-gray-200) solid;

  &:hover {
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15) !important;
  }

  &:before {
    display: none;
  }
`;

export const ImageWrapper = styled.div`
  width: 100%;
  height: 150px;
  position: relative;
  overflow: hidden;
  margin: 0;
  padding: 0;
  flex-shrink: 0;
  img {
    transition: transform 0.8s cubic-bezier(0.4, 0, 0.2, 1);
    object-fit: cover;
    width: 100%;
    height: 100%;
  }
`;

export const CardContent = styled.div`
  padding: 16px;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  gap: 8px;
  background: transparent;
  margin: 0;
  border-radius: 0 0 32px 32px;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  height: 100%;
`;

export const CardTitle = styled.h3`
  font-size: 1.3rem;
  font-weight: 600;
  margin: 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  transition: color 0.3s ease;
  padding: 0;
  overflow: hidden;
`;

export const CardMeta = styled.div`
  display: flex;
  color: var(--color-gray-500);
  font-size: 0.9rem;
  margin-top: 2px;
  font-weight: 400;
  transition: color 0.3s ease;
  padding: 0;
  svg {
    margin-right: 8px;
    color: var(--color-gray-400);
    fill: var(--color-gray-400);
    flex-shrink: 0;
    transition: color 0.3s ease;
  }
`;

export const ShareButtonWrapper = styled.div<{ $iconSize?: number }>`
  position: absolute;
  top: 4px;
  right: 4px;
  width: ${({ $iconSize }) => ($iconSize || 24) * 2}px;
  height: ${({ $iconSize }) => ($iconSize || 24) * 2}px;
  background: var(--color-white);
  border: 2px solid var(--color-gray-300);
  border-radius: 5px;
  z-index: 10;
  padding: 0;
`;

export const EventCardWrapper = styled.div`
  display: block;
  text-decoration: none;
  color: inherit;
  border-radius: 32px;
  height: 100%;
  width: 100%;
  border: none;
  outline: none;
  margin: auto;
  padding: 0;
  background: transparent;
  transition: none;

  &:hover {
    background: transparent;
    border: none;
    outline: none;
    transform: none;
    box-shadow: none;
  }

  &:focus {
    outline: none;
  }

  &:focus-visible {
    outline: 2px solid var(--google-blue);
    outline-offset: 2px;
  }
`;
