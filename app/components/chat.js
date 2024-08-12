"use client";
import {
  Box,
  Button,
  Stack,
  TextField,
  Avatar,
  AppBar,
  Toolbar,
  Typography,
  Container,
  IconButton,
  CssBaseline,
} from "@mui/material";
import { useChat } from "ai/react";
import { marked } from "marked";
import { useRef, useEffect } from "react";
import DOMPurify from "dompurify";
import SendIcon from "@mui/icons-material/Send";
import { avatarImg } from '../../data/index'


export function Chat() {
  const { messages, input, handleInputChange, handleSubmit } = useChat({
    api: "api/chat",
    onError: (e) => {
      console.log(e);
    },
  });
  const chatParent = useRef(null);

  useEffect(() => {
    const domNode = chatParent.current;
    if (domNode) {
      domNode.scrollTop = domNode.scrollHeight;
    }
  });

  return (
    <>
      <CssBaseline />
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          bgcolor: "white",
        }}
      >
        <AppBar position="static" color="transparent" elevation={0}>
          <Toolbar sx={{ justifyContent: "space-between" }}>
            {/* Logo Placeholder */}
            <Box
              component="img"
              src="/images/skin-clinic-medspa-logo.png"
              alt="Logo"
              sx={{ height: 40 }}
            />
            <Typography
              variant="h6"
              component="div"
              sx={{ flexGrow: 1, fontFamily: "Roboto", color: "grey.800" }}
            ></Typography>
          </Toolbar>
        </AppBar>

        <Container sx={{ flexGrow: 1, py: 3 }}>
          <Stack
            direction={"column"}
            spacing={2}
            flexGrow={1}
            sx={{
              bgcolor: "grey.100",
              borderRadius: 2,
              boxShadow: 3,
              overflow: "hidden",
              height: "100%",
              maxHeight: "100%",
            }}
          >
            <Box sx={{ overflowY: "auto", px: 3, py: 2, flexGrow: 1 }}>
              {messages.map((message, index) => {
                const isUser = message.role === "user";
                return (
                  <Box
                    key={index}
                    display="flex"
                    alignItems="flex-start"
                    justifyContent={isUser ? "flex-end" : "flex-start"}
                    sx={{
                      mb: 2,
                      transition: "all 0.3s ease",
                      "&:hover": {
                        transform: "scale(1.02)",
                      },
                    }}
                  >
                    {!isUser && (
                      <Avatar
                        alt="Assistant"
                        src={`/public/images/${avatarImg}`} // Fixed the avatar image path
                        sx={{ marginRight: 2 }}
                      />
                    )}
                    <Box
                      bgcolor={isUser ? "grey.800" : "grey.500"}
                      color="white"
                      borderRadius={16}
                      p={2}
                      maxWidth="75%"
                      dangerouslySetInnerHTML={{
                        __html: DOMPurify.sanitize(marked(message.content)),
                      }}
                    />
                  </Box>
                );
              })}
            </Box>

            <Box
              sx={{
                borderTop: 1,
                borderColor: "divider",
                p: 2,
                display: "flex",
                alignItems: "center",
                bgcolor: "white",
              }}
            >
              <TextField
                label="Type your message"
                fullWidth
                value={input}
                onChange={handleInputChange}
                variant="outlined"
                sx={{
                  marginRight: 2,
                  bgcolor: "grey.100",
                  borderRadius: 2,
                }}
              />
              <IconButton
                color="primary"
                onClick={handleSubmit}
              >
                <SendIcon />
              </IconButton>
            </Box>
          </Stack>
        </Container>
      </Box>
    </>
  );
}
