import * as WASM from 'automerge-wasm-pack'
import init from 'automerge-wasm-pack'
import * as Automerge from 'automerge-js'

import Repo from './Repo.js'
import LocalForageStorageAdapter from './storage/interfaces/LocalForageStorageAdapter'
import BCNetworkAdapter from './network/interfaces/BroadcastChannelNetworkAdapter'

import Network, { NetworkAdapter } from './network/Network'
import StorageSubsystem, { StorageAdapter } from './storage/StorageSubsystem'
import DependencyCollectionSynchronizer from './synchronizer/CollectionSynchronizer'

interface BrowserRepoConfig {
  storage?: StorageAdapter
  network?: NetworkAdapter[]
}

export default async function BrowserRepo(config: BrowserRepoConfig) {
  await init()
  Automerge.use(WASM)

  const { storage = new LocalForageStorageAdapter(), network = [new BCNetworkAdapter()]} = config

  const storageSubsystem = new StorageSubsystem(storage)
  const repo = new Repo(storageSubsystem)
  
  repo.on('document', e =>
    e.handle.on('change', ({ documentId, doc, changes }) => 
      storageSubsystem.save(documentId, doc, changes)
    )
  )

  const networkSubsystem = new Network(network)
  const synchronizer = new DependencyCollectionSynchronizer(repo)

  // wire up the dependency synchronizer
  networkSubsystem.on('peer', ({ peerId }) => synchronizer.addPeer(peerId))
  repo.on('document', ({ handle }) => synchronizer.addDocument(handle.documentId))
  networkSubsystem.on('message', (msg) => {
    const { senderId, message } = msg
    synchronizer.onSyncMessage(senderId, message)
  })
  synchronizer.on('message', ({ peerId, message }) => {
    networkSubsystem.onMessage(peerId, message)
  })

  networkSubsystem.join('sync_channel')

  return repo
}