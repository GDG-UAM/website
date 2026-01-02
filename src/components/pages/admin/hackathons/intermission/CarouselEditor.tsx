"use client";

import React, { useState } from "react";
import styled from "styled-components";
import { AddButton, DeleteButton, UpButton, DownButton } from "@/components/Buttons";
import { TextField, MenuItem, Select, FormControl, InputLabel } from "@mui/material";
import { CarouselElement, CarouselElementType, CarouselSlide } from "./IntermissionForm";
import { useTranslations } from "next-intl";

const EditorContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const TreeItem = styled.div<{ $selected?: boolean; $depth: number }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  padding-left: ${(props) => props.$depth * 24 + 12}px;
  background: ${(props) => (props.$selected ? "rgba(25, 118, 210, 0.08)" : "transparent")};
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 100%;
  width: fit-content;

  &:hover {
    background: ${(props) =>
      props.$selected ? "rgba(25, 118, 210, 0.12)" : "rgba(0, 0, 0, 0.04)"};
  }
`;

const Panel = styled.div`
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 4px;
  background-color: white;
  overflow: hidden;
`;

const LayoutTreePanel = styled(Panel)`
  padding: 16px;
  max-height: 600px;
  overflow-y: auto;
  overflow-x: auto;
`;

const PropertyPanel = styled(Panel)`
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const SlideHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;

  @media (max-width: 600px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const StyledDivider = styled.hr`
  border: none;
  border-top: 1px solid rgba(0, 0, 0, 0.12);
  margin: 0;
  width: 100%;
`;

const FlexBox = styled.div<{
  $direction?: string;
  $gap?: number | string;
  $align?: string;
  $justify?: string;
  $wrap?: string;
  $width?: string;
  $mt?: number;
  $mb?: number;
}>`
  display: flex;
  flex-direction: ${(props) => props.$direction || "row"};
  gap: ${(props) => (typeof props.$gap === "number" ? `${props.$gap * 8}px` : props.$gap || "0px")};
  align-items: ${(props) => props.$align || "stretch"};
  justify-content: ${(props) => props.$justify || "flex-start"};
  flex-wrap: ${(props) => props.$wrap || "nowrap"};
  width: ${(props) => props.$width || "auto"};
  margin-top: ${(props) => (props.$mt ? `${props.$mt * 8}px` : "0")};
  margin-bottom: ${(props) => (props.$mb ? `${props.$mb * 8}px` : "0")};
`;

const GridBox = styled.div<{ $columns?: string; $gap?: number }>`
  display: grid;
  grid-template-columns: ${(props) => props.$columns || "1fr"};
  gap: ${(props) => (props.$gap ? `${props.$gap * 8}px` : "0px")};

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const ActionBox = styled(FlexBox)`
  gap: 4px;
  flex-shrink: 0;
`;

const HeaderRow = styled(FlexBox)`
  margin-bottom: 16px;
  justify-content: space-between;
  align-items: center;
`;

const Label = styled.div<{ $variant?: "subtitle2" | "caption" | "body2"; $color?: string }>`
  font-family: inherit;
  font-weight: ${(props) =>
    props.$variant === "subtitle2" || props.$variant === "caption" ? 600 : 400};
  font-size: ${(props) =>
    props.$variant === "caption"
      ? "0.75rem"
      : props.$variant === "subtitle2"
        ? "0.875rem"
        : "1rem"};
  color: ${(props) => props.$color || "inherit"};
  margin-bottom: ${(props) => (props.$variant === "caption" ? "8px" : "0")};
`;

const Text = styled.div<{ $color?: string; $bold?: boolean; $transform?: string; $size?: string }>`
  font-family: inherit;
  color: ${(props) => props.$color || "inherit"};
  font-weight: ${(props) => (props.$bold ? 600 : 400)};
  text-transform: ${(props) => props.$transform || "none"};
  font-size: ${(props) => props.$size || "1rem"};
`;

const SmallText = styled.span`
  font-size: 0.75rem;
  color: rgba(0, 0, 0, 0.6);
  display: block;
  margin-bottom: 8px;
`;

const ElementTypeLabel = styled(Text)`
  font-weight: 600;
  color: rgba(0, 0, 0, 0.6);
  text-transform: uppercase;
  font-size: 0.7rem;
`;

const ElementContent = styled(Text)`
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 300px;
`;

const DEFAULT_PROPS: Record<CarouselElementType, CarouselElement["props"]> = {
  container: { direction: "column", gap: 20, alignItems: "center", justifyContent: "center" },
  text: { content: "Sample Text", variant: "h2", align: "center" },
  qr: { value: "https://gdguam.es", size: 250, cornerSize: 100, logoSize: 25 },
  image: { url: "", alt: "", height: "200px", objectFit: "contain" },
  spacer: { grow: 1 }
};

const createNewElement = (type: CarouselElementType): CarouselElement => ({
  id: Math.random().toString(36).substr(2, 9),
  type,
  props: { ...DEFAULT_PROPS[type] },
  children: type === "container" ? [] : undefined
});

export const CarouselEditor: React.FC<{
  slide: CarouselSlide;
  onChange: (slide: CarouselSlide) => void;
}> = ({ slide, onChange }) => {
  const t = useTranslations("admin.hackathons.intermission");
  const [selectedId, setSelectedId] = useState<string | null>(slide.root.id);

  const findElement = (root: CarouselElement, id: string): CarouselElement | null => {
    if (root.id === id) return root;
    if (root.children) {
      for (const child of root.children) {
        const found = findElement(child, id);
        if (found) return found;
      }
    }
    return null;
  };

  const updateElement = (
    root: CarouselElement,
    id: string,
    updater: (el: CarouselElement) => CarouselElement
  ): CarouselElement => {
    if (root.id === id) return updater(root);
    if (root.children) {
      return {
        ...root,
        children: root.children.map((child) => updateElement(child, id, updater))
      };
    }
    return root;
  };

  const deleteElement = (root: CarouselElement, id: string): CarouselElement | null => {
    if (root.id === id) return null; // Can't delete root
    if (root.children) {
      return {
        ...root,
        children: root.children
          .filter((child) => child.id !== id)
          .map((child) => deleteElement(child, id) as CarouselElement)
      };
    }
    return root;
  };

  const addElement = (parentId: string, type: CarouselElementType) => {
    const newEl = createNewElement(type);
    const newRoot = updateElement(slide.root, parentId, (parent) => ({
      ...parent,
      children: [...(parent.children || []), newEl]
    }));
    onChange({ ...slide, root: newRoot });
    setSelectedId(newEl.id);
  };

  const removeElement = (id: string) => {
    if (id === slide.root.id) return;
    const newRoot = deleteElement(slide.root, id);
    if (newRoot) {
      onChange({ ...slide, root: newRoot });
      setSelectedId(slide.root.id);
    }
  };

  const moveElement = (id: string, direction: "up" | "down") => {
    const findParent = (root: CarouselElement, targetId: string): CarouselElement | null => {
      if (root.children?.some((c) => c.id === targetId)) return root;
      if (root.children) {
        for (const child of root.children) {
          const p = findParent(child, targetId);
          if (p) return p;
        }
      }
      return null;
    };

    const parent = findParent(slide.root, id);
    if (!parent || !parent.children) return;

    const index = parent.children.findIndex((c) => c.id === id);
    const newChildren = [...parent.children];
    if (direction === "up" && index > 0) {
      [newChildren[index], newChildren[index - 1]] = [newChildren[index - 1], newChildren[index]];
    } else if (direction === "down" && index < newChildren.length - 1) {
      [newChildren[index], newChildren[index + 1]] = [newChildren[index + 1], newChildren[index]];
    }

    const newRoot = updateElement(slide.root, parent.id, (p) => ({ ...p, children: newChildren }));
    onChange({ ...slide, root: newRoot });
  };

  const handlePropChange = (
    id: string,
    propKey: keyof CarouselElement["props"],
    value: CarouselElement["props"][keyof CarouselElement["props"]]
  ) => {
    const newRoot = updateElement(slide.root, id, (el) => ({
      ...el,
      props: { ...el.props, [propKey]: value }
    }));
    onChange({ ...slide, root: newRoot });
  };

  const selectedElement = selectedId ? findElement(slide.root, selectedId) : null;

  const renderTree = (element: CarouselElement, depth: number = 0) => (
    <React.Fragment key={element.id}>
      <TreeItem
        $depth={depth}
        $selected={selectedId === element.id}
        onClick={() => setSelectedId(element.id)}
      >
        <ElementTypeLabel>{t(`elementTypes.${element.type}`)}</ElementTypeLabel>
        <ElementContent>
          {element.type === "text"
            ? element.props.content
            : element.type === "qr"
              ? element.props.value
              : element.type === "image"
                ? element.props.url || t("helpers.noImage")
                : element.type === "container"
                  ? `${t("values." + (element.props.direction || "column"))} (${element.children?.length || 0})`
                  : ""}
        </ElementContent>
        <ActionBox>
          <UpButton slim iconSize={16} onClick={() => moveElement(element.id, "up")} />
          <DownButton slim iconSize={16} onClick={() => moveElement(element.id, "down")} />
          {element.id !== slide.root.id && (
            <DeleteButton slim iconSize={16} onClick={() => removeElement(element.id)} />
          )}
        </ActionBox>
      </TreeItem>
      {element.children?.map((child) => renderTree(child, depth + 1))}
    </React.Fragment>
  );

  return (
    <EditorContainer>
      <SlideHeader>
        <TextField
          label={t("fields.carouselLabel")}
          value={slide.label || ""}
          onChange={(e) => onChange({ ...slide, label: e.target.value })}
          size="small"
          fullWidth
        />
        <TextField
          label={t("fields.carouselDuration")}
          type="number"
          value={slide.duration}
          onChange={(e) => onChange({ ...slide, duration: parseInt(e.target.value) })}
          size="small"
          sx={{ width: { xs: "100%", sm: 100 } }}
        />
      </SlideHeader>

      <GridBox $columns="1fr 1fr" $gap={3}>
        <LayoutTreePanel>
          <HeaderRow>
            <Label $variant="subtitle2">{t("sections.layoutTree")}</Label>
          </HeaderRow>
          {renderTree(slide.root)}
        </LayoutTreePanel>

        <PropertyPanel>
          <Label $variant="subtitle2">
            {t("sections.properties")}:{" "}
            {selectedElement ? t(`elementTypes.${selectedElement.type}`) : ""}
          </Label>
          <StyledDivider />
          {selectedElement && (
            <FlexBox $direction="column" $gap={2}>
              {selectedElement.type === "container" && (
                <>
                  <FormControl fullWidth size="small">
                    <InputLabel>{t("fields.direction")}</InputLabel>
                    <Select
                      value={selectedElement.props.direction}
                      label={t("fields.direction")}
                      onChange={(e) =>
                        handlePropChange(selectedElement.id, "direction", e.target.value)
                      }
                    >
                      <MenuItem value="column">{t("values.column")}</MenuItem>
                      <MenuItem value="row">{t("values.row")}</MenuItem>
                    </Select>
                  </FormControl>
                  <TextField
                    label={t("fields.gap")}
                    type="number"
                    fullWidth
                    size="small"
                    value={selectedElement.props.gap}
                    onChange={(e) =>
                      handlePropChange(selectedElement.id, "gap", parseInt(e.target.value))
                    }
                  />
                  <FormControl fullWidth size="small">
                    <InputLabel>{t("fields.alignItems")}</InputLabel>
                    <Select
                      value={selectedElement.props.alignItems}
                      label={t("fields.alignItems")}
                      onChange={(e) =>
                        handlePropChange(selectedElement.id, "alignItems", e.target.value)
                      }
                    >
                      <MenuItem value="flex-start">{t("values.start")}</MenuItem>
                      <MenuItem value="center">{t("values.center")}</MenuItem>
                      <MenuItem value="flex-end">{t("values.end")}</MenuItem>
                      <MenuItem value="stretch">{t("values.stretch")}</MenuItem>
                    </Select>
                  </FormControl>
                  <FormControl fullWidth size="small">
                    <InputLabel>{t("fields.justifyContent")}</InputLabel>
                    <Select
                      value={selectedElement.props.justifyContent}
                      label={t("fields.justifyContent")}
                      onChange={(e) =>
                        handlePropChange(selectedElement.id, "justifyContent", e.target.value)
                      }
                    >
                      <MenuItem value="flex-start">{t("values.start")}</MenuItem>
                      <MenuItem value="center">{t("values.center")}</MenuItem>
                      <MenuItem value="flex-end">{t("values.end")}</MenuItem>
                      <MenuItem value="space-between">{t("values.spaceBetween")}</MenuItem>
                      <MenuItem value="space-around">{t("values.spaceAround")}</MenuItem>
                    </Select>
                  </FormControl>
                  <TextField
                    label={t("fields.padding")}
                    fullWidth
                    size="small"
                    value={selectedElement.props.padding || ""}
                    onChange={(e) =>
                      handlePropChange(selectedElement.id, "padding", e.target.value)
                    }
                  />
                  <FlexBox $mt={1} $direction="column">
                    <SmallText>{t("helpers.addChild")}</SmallText>
                    <FlexBox $wrap="wrap" $gap={1}>
                      <AddButton slim onClick={() => addElement(selectedElement.id, "text")}>
                        {t("elementTypes.text")}
                      </AddButton>
                      <AddButton slim onClick={() => addElement(selectedElement.id, "qr")}>
                        {t("elementTypes.qr")}
                      </AddButton>
                      <AddButton slim onClick={() => addElement(selectedElement.id, "image")}>
                        {t("elementTypes.image")}
                      </AddButton>
                      <AddButton slim onClick={() => addElement(selectedElement.id, "container")}>
                        {t("elementTypes.container")}
                      </AddButton>
                      <AddButton slim onClick={() => addElement(selectedElement.id, "spacer")}>
                        {t("elementTypes.spacer")}
                      </AddButton>
                    </FlexBox>
                  </FlexBox>
                </>
              )}

              {selectedElement.type === "text" && (
                <>
                  <TextField
                    label={t("fields.content")}
                    fullWidth
                    multiline
                    rows={4}
                    size="small"
                    value={selectedElement.props.content}
                    onChange={(e) =>
                      handlePropChange(selectedElement.id, "content", e.target.value)
                    }
                  />
                  <FormControl fullWidth size="small">
                    <InputLabel>{t("fields.variant")}</InputLabel>
                    <Select
                      value={selectedElement.props.variant}
                      label={t("fields.variant")}
                      onChange={(e) =>
                        handlePropChange(selectedElement.id, "variant", e.target.value)
                      }
                    >
                      <MenuItem value="h1">{t("values.hero")}</MenuItem>
                      <MenuItem value="h2">{t("values.title")}</MenuItem>
                      <MenuItem value="h3">{t("values.subtitle")}</MenuItem>
                      <MenuItem value="body">{t("values.body")}</MenuItem>
                    </Select>
                  </FormControl>
                  <TextField
                    label={t("fields.fontSize")}
                    fullWidth
                    size="small"
                    value={selectedElement.props.fontSize || ""}
                    onChange={(e) =>
                      handlePropChange(selectedElement.id, "fontSize", e.target.value)
                    }
                  />
                  <TextField
                    label={t("fields.fontWeight")}
                    fullWidth
                    size="small"
                    value={selectedElement.props.fontWeight || ""}
                    onChange={(e) =>
                      handlePropChange(selectedElement.id, "fontWeight", e.target.value)
                    }
                  />
                  <FormControl fullWidth size="small">
                    <InputLabel>{t("fields.alignment")}</InputLabel>
                    <Select
                      value={selectedElement.props.align}
                      label={t("fields.alignment")}
                      onChange={(e) =>
                        handlePropChange(selectedElement.id, "align", e.target.value)
                      }
                    >
                      <MenuItem value="left">{t("values.left")}</MenuItem>
                      <MenuItem value="center">{t("values.center")}</MenuItem>
                      <MenuItem value="right">{t("values.right")}</MenuItem>
                    </Select>
                  </FormControl>
                  <TextField
                    label={t("fields.color")}
                    fullWidth
                    size="small"
                    value={selectedElement.props.color || ""}
                    onChange={(e) => handlePropChange(selectedElement.id, "color", e.target.value)}
                  />
                </>
              )}

              {selectedElement.type === "qr" && (
                <>
                  <TextField
                    label={t("fields.qrValue")}
                    fullWidth
                    size="small"
                    value={selectedElement.props.value}
                    onChange={(e) => handlePropChange(selectedElement.id, "value", e.target.value)}
                  />
                  <GridBox $columns="1fr 1fr" $gap={2}>
                    <TextField
                      label={t("fields.size")}
                      type="number"
                      fullWidth
                      size="small"
                      value={selectedElement.props.size}
                      onChange={(e) =>
                        handlePropChange(selectedElement.id, "size", parseInt(e.target.value))
                      }
                    />
                    <TextField
                      label={t("fields.cornerSize")}
                      type="number"
                      fullWidth
                      size="small"
                      value={selectedElement.props.cornerSize}
                      onChange={(e) =>
                        handlePropChange(selectedElement.id, "cornerSize", parseInt(e.target.value))
                      }
                    />
                  </GridBox>
                  <TextField
                    label={t("fields.cornerColor")}
                    fullWidth
                    size="small"
                    placeholder="e.g. #4285F4"
                    value={selectedElement.props.cornerColor || ""}
                    onChange={(e) =>
                      handlePropChange(selectedElement.id, "cornerColor", e.target.value)
                    }
                    helperText={t("helpers.googleColors")}
                  />
                  <TextField
                    label={t("fields.logoUrl")}
                    fullWidth
                    size="small"
                    placeholder="https://..."
                    value={selectedElement.props.logoUrl || ""}
                    onChange={(e) =>
                      handlePropChange(selectedElement.id, "logoUrl", e.target.value)
                    }
                  />
                  <TextField
                    label={t("fields.logoSize")}
                    type="number"
                    fullWidth
                    size="small"
                    value={selectedElement.props.logoSize || 25}
                    onChange={(e) =>
                      handlePropChange(selectedElement.id, "logoSize", parseInt(e.target.value))
                    }
                    helperText={t("helpers.recommendedSize")}
                  />
                </>
              )}

              {selectedElement.type === "image" && (
                <>
                  <TextField
                    label={t("fields.imageUrl")}
                    fullWidth
                    size="small"
                    value={selectedElement.props.url}
                    onChange={(e) => handlePropChange(selectedElement.id, "url", e.target.value)}
                  />
                  <TextField
                    label={t("fields.height")}
                    fullWidth
                    size="small"
                    value={selectedElement.props.height}
                    onChange={(e) => handlePropChange(selectedElement.id, "height", e.target.value)}
                  />
                  <FormControl fullWidth size="small">
                    <InputLabel>{t("fields.objectFit")}</InputLabel>
                    <Select
                      value={selectedElement.props.objectFit}
                      label={t("fields.objectFit")}
                      onChange={(e) =>
                        handlePropChange(selectedElement.id, "objectFit", e.target.value)
                      }
                    >
                      <MenuItem value="contain">{t("values.contain")}</MenuItem>
                      <MenuItem value="cover">{t("values.cover")}</MenuItem>
                    </Select>
                  </FormControl>
                </>
              )}

              {selectedElement.type === "spacer" && (
                <TextField
                  label={t("fields.flexGrow")}
                  type="number"
                  fullWidth
                  size="small"
                  value={selectedElement.props.grow}
                  onChange={(e) =>
                    handlePropChange(selectedElement.id, "grow", parseInt(e.target.value))
                  }
                />
              )}

              <FlexBox $mt={2}>
                <TextField
                  label={t("fields.flexBasis")}
                  type="number"
                  fullWidth
                  size="small"
                  value={selectedElement.props.flex || ""}
                  onChange={(e) =>
                    handlePropChange(
                      selectedElement.id,
                      "flex",
                      e.target.value ? parseInt(e.target.value) : undefined
                    )
                  }
                />
              </FlexBox>
            </FlexBox>
          )}
          {!selectedElement && (
            <Text $size="0.875rem" $color="rgba(0, 0, 0, 0.6)">
              {t("helpers.selectElement")}
            </Text>
          )}
        </PropertyPanel>
      </GridBox>
    </EditorContainer>
  );
};
