// CAD 타입
export type {
    Vector2,
    Vector3,
    CADUnit,
    EntityType,
    BaseEntity,
    LineEntity,
    CircleEntity,
    ArcEntity,
    PolylineVertex,
    PolylineEntity,
    PointEntity,
    TextEntity,
    SplineEntity,
    EllipseEntity,
    CADEntity,
    CADLayer,
    BoundingBox,
    CADData,
    CADMetadata,
    ParseOptions,
    ParseError,
    ParseResult,
    ConversionOptions,
    ConversionResult,
    GeometryData,
    MaterialData,
    ComplexityScore,
    CADFile,
    CADFileFormat,
} from './cad';

export { detectFileFormat } from './cad';

// 동기화 타입
export type {
    TransportType,
    ConnectionState,
    DeviceRole,
    TransportConfig,
    Transport,
    MessageHandler,
    ConnectionHandler,
    Unsubscribe,
    MessageType,
    SyncMessage,
    DeviceInfo,
    ViewportState,
    CameraState,
    SelectionState,
    VisibilityState,
    ConflictStrategy,
    SyncEngineConfig,
    SyncEngineState,
    WebSocketConfig,
    WebRTCConfig,
    RTCSignalingMessage,
    DeviceJoinPayload,
    DeviceLeavePayload,
    ViewStateUpdatePayload,
    CameraUpdatePayload,
    SelectionUpdatePayload,
    LayerUpdatePayload,
    ModelLoadedPayload,
    SyncRequestPayload,
    SyncResponsePayload,
    ErrorPayload,
} from './sync';

export { createSyncMessage, isValidMessage } from './sync';

// 뷰어 타입
export type {
    RenderMode,
    ProjectionMode,
    ViewerConfig,
    ViewerState,
    ViewerActions,
    ViewportInfo,
    SelectionEvent,
    CameraPreset,
    MeasurementType,
    Measurement,
    Annotation,
    LayerPanelItem,
} from './viewer';

export { DEFAULT_VIEWER_CONFIG, CAMERA_PRESETS } from './viewer';
