"use client";

import React, { useState } from "react";
import styled from "styled-components";
import { AddButton, DeleteButton, UpButton, DownButton } from "@/components/Buttons";
import {
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Box,
  Typography,
  Paper,
  Divider
} from "@mui/material";
import { CarouselElement, CarouselElementType, CarouselSlide } from "./IntermissionForm";

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

  &:hover {
    background: ${(props) =>
      props.$selected ? "rgba(25, 118, 210, 0.12)" : "rgba(0, 0, 0, 0.04)"};
  }
`;

const PropertyPanel = styled(Paper)`
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const SlideHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  background: #f5f5f5;
  border-radius: 8px;
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
        <Typography
          variant="body2"
          sx={{
            fontWeight: 600,
            color: "text.secondary",
            textTransform: "uppercase",
            fontSize: "0.7rem"
          }}
        >
          {element.type}
        </Typography>
        <Typography
          variant="body1"
          sx={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
        >
          {element.type === "text"
            ? element.props.content
            : element.type === "qr"
              ? element.props.value
              : element.type === "image"
                ? element.props.url || "No image URL"
                : element.type === "container"
                  ? `${element.props.direction} (${element.children?.length || 0})`
                  : ""}
        </Typography>
        <Box sx={{ display: "flex", gap: 0.5 }}>
          <UpButton slim iconSize={16} onClick={() => moveElement(element.id, "up")} />
          <DownButton slim iconSize={16} onClick={() => moveElement(element.id, "down")} />
          {element.id !== slide.root.id && (
            <DeleteButton slim iconSize={16} onClick={() => removeElement(element.id)} />
          )}
        </Box>
      </TreeItem>
      {element.children?.map((child) => renderTree(child, depth + 1))}
    </React.Fragment>
  );

  return (
    <EditorContainer>
      <SlideHeader>
        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          <TextField
            label="Slide Label"
            value={slide.label || ""}
            onChange={(e) => onChange({ ...slide, label: e.target.value })}
            size="small"
          />
          <TextField
            label="Duration (s)"
            type="number"
            value={slide.duration}
            onChange={(e) => onChange({ ...slide, duration: parseInt(e.target.value) })}
            size="small"
            sx={{ width: 100 }}
          />
        </Box>
      </SlideHeader>

      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3 }}>
        <Paper variant="outlined" sx={{ p: 2, maxHeight: 600, overflow: "auto" }}>
          <Box
            sx={{ mb: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}
          >
            <Typography variant="subtitle2">Layout Tree</Typography>
          </Box>
          {renderTree(slide.root)}
        </Paper>

        <PropertyPanel variant="outlined">
          <Typography variant="subtitle2">Properties: {selectedElement?.type}</Typography>
          <Divider />
          {selectedElement && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {selectedElement.type === "container" && (
                <>
                  <FormControl fullWidth size="small">
                    <InputLabel>Direction</InputLabel>
                    <Select
                      value={selectedElement.props.direction}
                      label="Direction"
                      onChange={(e) =>
                        handlePropChange(selectedElement.id, "direction", e.target.value)
                      }
                    >
                      <MenuItem value="column">Column</MenuItem>
                      <MenuItem value="row">Row</MenuItem>
                    </Select>
                  </FormControl>
                  <TextField
                    label="Gap"
                    type="number"
                    fullWidth
                    size="small"
                    value={selectedElement.props.gap}
                    onChange={(e) =>
                      handlePropChange(selectedElement.id, "gap", parseInt(e.target.value))
                    }
                  />
                  <FormControl fullWidth size="small">
                    <InputLabel>Align Items</InputLabel>
                    <Select
                      value={selectedElement.props.alignItems}
                      label="Align Items"
                      onChange={(e) =>
                        handlePropChange(selectedElement.id, "alignItems", e.target.value)
                      }
                    >
                      <MenuItem value="flex-start">Start</MenuItem>
                      <MenuItem value="center">Center</MenuItem>
                      <MenuItem value="flex-end">End</MenuItem>
                      <MenuItem value="stretch">Stretch</MenuItem>
                    </Select>
                  </FormControl>
                  <FormControl fullWidth size="small">
                    <InputLabel>Justify Content</InputLabel>
                    <Select
                      value={selectedElement.props.justifyContent}
                      label="Justify Content"
                      onChange={(e) =>
                        handlePropChange(selectedElement.id, "justifyContent", e.target.value)
                      }
                    >
                      <MenuItem value="flex-start">Start</MenuItem>
                      <MenuItem value="center">Center</MenuItem>
                      <MenuItem value="flex-end">End</MenuItem>
                      <MenuItem value="space-between">Space Between</MenuItem>
                      <MenuItem value="space-around">Space Around</MenuItem>
                    </Select>
                  </FormControl>
                  <TextField
                    label="Padding (e.g. 20px 40px)"
                    fullWidth
                    size="small"
                    value={selectedElement.props.padding || ""}
                    onChange={(e) =>
                      handlePropChange(selectedElement.id, "padding", e.target.value)
                    }
                  />
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="caption" sx={{ mb: 1, display: "block" }}>
                      Add Child
                    </Typography>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                      <AddButton slim onClick={() => addElement(selectedElement.id, "text")}>
                        Text
                      </AddButton>
                      <AddButton slim onClick={() => addElement(selectedElement.id, "qr")}>
                        QR
                      </AddButton>
                      <AddButton slim onClick={() => addElement(selectedElement.id, "image")}>
                        Image
                      </AddButton>
                      <AddButton slim onClick={() => addElement(selectedElement.id, "container")}>
                        Container
                      </AddButton>
                      <AddButton slim onClick={() => addElement(selectedElement.id, "spacer")}>
                        Spacer
                      </AddButton>
                    </Box>
                  </Box>
                </>
              )}

              {selectedElement.type === "text" && (
                <>
                  <TextField
                    label="Content"
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
                    <InputLabel>Variant</InputLabel>
                    <Select
                      value={selectedElement.props.variant}
                      label="Variant"
                      onChange={(e) =>
                        handlePropChange(selectedElement.id, "variant", e.target.value)
                      }
                    >
                      <MenuItem value="h1">H1 (Hero)</MenuItem>
                      <MenuItem value="h2">H2 (Title)</MenuItem>
                      <MenuItem value="h3">H3 (Subtitle)</MenuItem>
                      <MenuItem value="body">Body</MenuItem>
                    </Select>
                  </FormControl>
                  <TextField
                    label="Font Size (e.g. 4rem)"
                    fullWidth
                    size="small"
                    value={selectedElement.props.fontSize || ""}
                    onChange={(e) =>
                      handlePropChange(selectedElement.id, "fontSize", e.target.value)
                    }
                  />
                  <TextField
                    label="Font Weight (e.g. 800)"
                    fullWidth
                    size="small"
                    value={selectedElement.props.fontWeight || ""}
                    onChange={(e) =>
                      handlePropChange(selectedElement.id, "fontWeight", e.target.value)
                    }
                  />
                  <FormControl fullWidth size="small">
                    <InputLabel>Alignment</InputLabel>
                    <Select
                      value={selectedElement.props.align}
                      label="Alignment"
                      onChange={(e) =>
                        handlePropChange(selectedElement.id, "align", e.target.value)
                      }
                    >
                      <MenuItem value="left">Left</MenuItem>
                      <MenuItem value="center">Center</MenuItem>
                      <MenuItem value="right">Right</MenuItem>
                    </Select>
                  </FormControl>
                  <TextField
                    label="Color (hex or var)"
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
                    label="QR Value"
                    fullWidth
                    size="small"
                    value={selectedElement.props.value}
                    onChange={(e) => handlePropChange(selectedElement.id, "value", e.target.value)}
                  />
                  <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                    <TextField
                      label="Size (px)"
                      type="number"
                      fullWidth
                      size="small"
                      value={selectedElement.props.size}
                      onChange={(e) =>
                        handlePropChange(selectedElement.id, "size", parseInt(e.target.value))
                      }
                    />
                    <TextField
                      label="Corner Size (px)"
                      type="number"
                      fullWidth
                      size="small"
                      value={selectedElement.props.cornerSize}
                      onChange={(e) =>
                        handlePropChange(selectedElement.id, "cornerSize", parseInt(e.target.value))
                      }
                    />
                  </Box>
                  <TextField
                    label="Corner Color (optional)"
                    fullWidth
                    size="small"
                    placeholder="e.g. #4285F4"
                    value={selectedElement.props.cornerColor || ""}
                    onChange={(e) =>
                      handlePropChange(selectedElement.id, "cornerColor", e.target.value)
                    }
                    helperText="Leave empty for default Google colors"
                  />
                  <TextField
                    label="Logo URL (optional)"
                    fullWidth
                    size="small"
                    placeholder="https://..."
                    value={selectedElement.props.logoUrl || ""}
                    onChange={(e) =>
                      handlePropChange(selectedElement.id, "logoUrl", e.target.value)
                    }
                  />
                  <TextField
                    label="Logo Size (%)"
                    type="number"
                    fullWidth
                    size="small"
                    value={selectedElement.props.logoSize || 25}
                    onChange={(e) =>
                      handlePropChange(selectedElement.id, "logoSize", parseInt(e.target.value))
                    }
                    helperText="Recommended: 15-25%"
                  />
                </>
              )}

              {selectedElement.type === "image" && (
                <>
                  <TextField
                    label="Image URL"
                    fullWidth
                    size="small"
                    value={selectedElement.props.url}
                    onChange={(e) => handlePropChange(selectedElement.id, "url", e.target.value)}
                  />
                  <TextField
                    label="Height (e.g. 200px)"
                    fullWidth
                    size="small"
                    value={selectedElement.props.height}
                    onChange={(e) => handlePropChange(selectedElement.id, "height", e.target.value)}
                  />
                  <FormControl fullWidth size="small">
                    <InputLabel>Object Fit</InputLabel>
                    <Select
                      value={selectedElement.props.objectFit}
                      label="Object Fit"
                      onChange={(e) =>
                        handlePropChange(selectedElement.id, "objectFit", e.target.value)
                      }
                    >
                      <MenuItem value="contain">Contain</MenuItem>
                      <MenuItem value="cover">Cover</MenuItem>
                    </Select>
                  </FormControl>
                </>
              )}

              {selectedElement.type === "spacer" && (
                <TextField
                  label="Flex Grow"
                  type="number"
                  fullWidth
                  size="small"
                  value={selectedElement.props.grow}
                  onChange={(e) =>
                    handlePropChange(selectedElement.id, "grow", parseInt(e.target.value))
                  }
                />
              )}

              <Box sx={{ mt: 2 }}>
                <TextField
                  label="Flex Basis / Width (if row)"
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
              </Box>
            </Box>
          )}
          {!selectedElement && (
            <Typography variant="body2" color="text.secondary">
              Select an element to edit its properties
            </Typography>
          )}
        </PropertyPanel>
      </Box>
    </EditorContainer>
  );
};
