"use strict";
'use server';
Object.defineProperty(exports, "__esModule", { value: true });
exports.supportChat = void 0;
/**
 * Redirection vers le flux unique support-chat-flow pour éviter les doublons.
 */
var support_chat_flow_1 = require("./support-chat-flow");
Object.defineProperty(exports, "supportChat", { enumerable: true, get: function () { return support_chat_flow_1.supportChat; } });
//# sourceMappingURL=support-chat-flows.js.map