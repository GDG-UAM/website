"use client";

import React from "react";
import styled from "styled-components";
import { CustomQRCode } from "@/components/QRCode/CustomQRCode";
import { CarouselElement } from "../admin/hackathons/intermission/IntermissionForm";

const ElementContainer = styled.div<{
  $direction?: string;
  $gap?: number;
  $alignItems?: string;
  $justifyContent?: string;
  $flex?: number;
  $padding?: string;
}>`
  display: flex;
  flex-direction: ${(props) => props.$direction || "column"};
  gap: ${(props) => props.$gap || 0}px;
  align-items: ${(props) => props.$alignItems || "center"};
  justify-content: ${(props) => props.$justifyContent || "center"};
  flex: ${(props) => (props.$flex !== undefined ? props.$flex : "none")};
  padding: ${(props) => props.$padding || "0"};
  width: ${(props) => (props.$flex !== undefined ? "auto" : "100%")};
`;

const TextElement = styled.div<{
  $variant?: string;
  $color?: string;
  $align?: string;
  $fontSize?: string;
  $fontWeight?: string;
}>`
  ${(props) => props.$color && `color: ${props.$color};`}
  ${(props) => props.$align && `text-align: ${props.$align};`}
  ${(props) => props.$fontWeight && `font-weight: ${props.$fontWeight};`}
  ${(props) => props.$fontSize && `font-size: ${props.$fontSize};`}
  
  margin: 0;
  white-space: pre-wrap;
`;

const ImageElement = styled.img<{
  $height?: string;
  $width?: string;
  $objectFit?: string;
}>`
  height: ${(props) => props.$height || "auto"};
  width: ${(props) => props.$width || "auto"};
  object-fit: ${(props) => props.$objectFit || "contain"};
  max-width: 100%;
  display: block;
  border-radius: 20px;
`;

const SpacerElement = styled.div<{
  $grow?: number;
  $height?: number;
  $width?: number;
}>`
  flex-grow: ${(props) => props.$grow || 0};
  height: ${(props) => (props.$height ? `${props.$height}px` : "auto")};
  width: ${(props) => (props.$width ? `${props.$width}px` : "auto")};
`;

export const CarouselRenderer: React.FC<{ element: CarouselElement }> = ({ element }) => {
  const { type, props, children } = element;

  switch (type) {
    case "container":
      return (
        <ElementContainer
          $direction={props.direction}
          $gap={props.gap}
          $alignItems={props.alignItems}
          $justifyContent={props.justifyContent}
          $flex={props.flex}
          $padding={props.padding}
        >
          {children?.map((child) => (
            <CarouselRenderer key={child.id} element={child} />
          ))}
        </ElementContainer>
      );
    case "text":
      const tag = props.variant === "body" ? "p" : props.variant || "div";
      return (
        <TextElement
          as={tag}
          $variant={props.variant}
          $color={props.color}
          $align={props.align}
          $fontSize={props.fontSize}
          $fontWeight={props.fontWeight}
        >
          {props.content}
        </TextElement>
      );
    case "qr":
      return (
        <CustomQRCode
          value={props.value || ""}
          size={props.size || 250}
          cornerSize={props.cornerSize || 100}
          cornerColor={props.cornerColor}
          logoUrl={props.logoUrl}
          logoSize={props.logoSize}
        />
      );
    case "image":
      return (
        <ImageElement
          src={props.url}
          alt={props.alt || ""}
          $height={props.height}
          $width={props.width}
          $objectFit={props.objectFit}
        />
      );
    case "spacer":
      return <SpacerElement $grow={props.grow} $height={props.heightPx} $width={props.widthPx} />;
    default:
      return null;
  }
};
