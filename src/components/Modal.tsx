import React from "react";
import styled from "styled-components";
import { Dialog, DialogTitle, DialogContent, Breakpoint } from "@mui/material";
import { CancelButton } from "@/components/Buttons";
import { CustomButtonColor } from "./_buttons/CustomButton";

const ModalContent = styled.div`
  padding: 20px;
`;

interface ModalProps {
  isOpen: boolean;
  onClose?: () => void;
  closeButtonColor?: CustomButtonColor;
  children: React.ReactNode;
  title?: string;
  width?: Breakpoint;
  buttons?: React.ReactNode[];
  buttonPosition?: "left" | "right" | "center";
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  closeButtonColor,
  children,
  title,
  width = "md",
  buttons,
  buttonPosition = "right"
}) => {
  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onClose={onClose} maxWidth={width} fullWidth>
      <DialogTitle>
        {title}
        {onClose && (
          <CancelButton
            onClick={onClose}
            color={closeButtonColor}
            style={{
              position: "absolute",
              right: 8,
              top: 8
            }}
          />
        )}
      </DialogTitle>
      <DialogContent dividers>
        <ModalContent>
          {children}
          {buttons && (
            <div
              style={{
                display: "flex",
                justifyContent:
                  buttonPosition === "right"
                    ? "flex-end"
                    : buttonPosition === "left"
                      ? "flex-start"
                      : "center",
                marginTop: 16
              }}
            >
              {buttons.map((button, index) => (
                <div key={index} style={{ marginLeft: 8 }}>
                  {button}
                </div>
              ))}
            </div>
          )}
        </ModalContent>
      </DialogContent>
    </Dialog>
  );
};

export default Modal;
