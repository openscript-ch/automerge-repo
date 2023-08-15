import { Message, PeerId } from "@automerge/automerge-repo"
import { ProtocolVersion } from "./protocolVersion.js"

export type LeaveMessage = {
  type: "leave"
  senderId: PeerId
}

export type JoinMessage = {
  type: "join"
  senderId: PeerId
  supportedProtocolVersions: ProtocolVersion[]
}

export type PeerMessage = {
  type: "peer"
  senderId: PeerId
  selectedProtocolVersion: ProtocolVersion
  targetId: PeerId
}

export type ErrorMessage = {
  type: "error"
  senderId: PeerId
  message: string
  targetId: PeerId
}

export type FromClientMessage = JoinMessage | LeaveMessage | Message

export type FromServerMessage = PeerMessage | ErrorMessage | Message
