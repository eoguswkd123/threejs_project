/**
 * CAD 엔티티를 Three.js 지오메트리로 변환
 */

import * as THREE from 'three';
import type {
    CADEntity,
    CADData,
    LineEntity,
    CircleEntity,
    ArcEntity,
    PolylineEntity,
    PointEntity,
    SplineEntity,
    EllipseEntity,
    ConversionOptions,
    Vector3,
} from '@types/cad';

// 기본 변환 옵션
const DEFAULT_OPTIONS: Required<ConversionOptions> = {
    renderMode: 'wireframe',
    color: 0x000000,
    lineWidth: 1,
    segmentsPerCircle: 64,
};

// DXF 색상 팔레트 (ACI - AutoCAD Color Index)
const DXF_COLOR_PALETTE: number[] = [
    0x000000, // 0 - ByBlock
    0xff0000, // 1 - Red
    0xffff00, // 2 - Yellow
    0x00ff00, // 3 - Green
    0x00ffff, // 4 - Cyan
    0x0000ff, // 5 - Blue
    0xff00ff, // 6 - Magenta
    0xffffff, // 7 - White/Black
    0x808080, // 8 - Gray
    0xc0c0c0, // 9 - Light Gray
];

/**
 * DXF 색상 인덱스를 Three.js Color로 변환
 */
export function aciToColor(colorIndex?: number): THREE.Color {
    if (colorIndex === undefined || colorIndex < 0 || colorIndex >= 256) {
        return new THREE.Color(0x000000);
    }
    if (colorIndex < DXF_COLOR_PALETTE.length) {
        return new THREE.Color(DXF_COLOR_PALETTE[colorIndex]);
    }
    // 256색 팔레트 확장 (간단한 근사)
    return new THREE.Color(0x000000);
}

/**
 * CAD 데이터 전체를 Three.js Object3D로 변환
 */
export function convertCADToThree(
    cadData: CADData,
    options: ConversionOptions = {}
): THREE.Group {
    const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
    const group = new THREE.Group();
    group.name = 'CAD_Model';

    // 레이어별 그룹 생성
    const layerGroups = new Map<string, THREE.Group>();

    for (const layer of cadData.layers) {
        const layerGroup = new THREE.Group();
        layerGroup.name = `Layer_${layer.name}`;
        layerGroup.visible = layer.visible;
        layerGroups.set(layer.name, layerGroup);
        group.add(layerGroup);
    }

    // 엔티티 변환
    for (const entity of cadData.entities) {
        const object = convertEntity(entity, mergedOptions);
        if (object) {
            object.userData = { entityId: entity.id, type: entity.type };

            let layerGroup = layerGroups.get(entity.layer);
            if (!layerGroup) {
                layerGroup = new THREE.Group();
                layerGroup.name = `Layer_${entity.layer}`;
                layerGroups.set(entity.layer, layerGroup);
                group.add(layerGroup);
            }
            layerGroup.add(object);
        }
    }

    return group;
}

/**
 * 단일 엔티티를 Three.js Object3D로 변환
 */
export function convertEntity(
    entity: CADEntity,
    options: Required<ConversionOptions>
): THREE.Object3D | null {
    const color = entity.color !== undefined ? aciToColor(entity.color) : new THREE.Color(options.color);

    switch (entity.type) {
        case 'LINE':
            return convertLine(entity as LineEntity, color);
        case 'CIRCLE':
            return convertCircle(entity as CircleEntity, color, options.segmentsPerCircle);
        case 'ARC':
            return convertArc(entity as ArcEntity, color, options.segmentsPerCircle);
        case 'POLYLINE':
        case 'LWPOLYLINE':
            return convertPolyline(entity as PolylineEntity, color, options.segmentsPerCircle);
        case 'POINT':
            return convertPoint(entity as PointEntity, color);
        case 'SPLINE':
            return convertSpline(entity as SplineEntity, color);
        case 'ELLIPSE':
            return convertEllipse(entity as EllipseEntity, color, options.segmentsPerCircle);
        default:
            return null;
    }
}

/**
 * LINE 엔티티 변환
 */
function convertLine(entity: LineEntity, color: THREE.Color): THREE.Line {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array([
        entity.start[0], entity.start[1], entity.start[2],
        entity.end[0], entity.end[1], entity.end[2],
    ]);
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.LineBasicMaterial({ color });
    const line = new THREE.Line(geometry, material);
    line.name = `Line_${entity.id}`;

    return line;
}

/**
 * CIRCLE 엔티티 변환
 */
function convertCircle(entity: CircleEntity, color: THREE.Color, segments: number): THREE.Line {
    const points: THREE.Vector3[] = [];

    for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        points.push(new THREE.Vector3(
            entity.center[0] + Math.cos(angle) * entity.radius,
            entity.center[1] + Math.sin(angle) * entity.radius,
            entity.center[2]
        ));
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({ color });
    const circle = new THREE.Line(geometry, material);
    circle.name = `Circle_${entity.id}`;

    return circle;
}

/**
 * ARC 엔티티 변환
 */
function convertArc(entity: ArcEntity, color: THREE.Color, segments: number): THREE.Line {
    const points: THREE.Vector3[] = [];

    // 각도를 라디안으로 변환
    const startRad = (entity.startAngle * Math.PI) / 180;
    let endRad = (entity.endAngle * Math.PI) / 180;

    // 시계 반대 방향 처리
    if (endRad < startRad) {
        endRad += Math.PI * 2;
    }

    const angleRange = endRad - startRad;
    const arcSegments = Math.max(2, Math.ceil((angleRange / (Math.PI * 2)) * segments));

    for (let i = 0; i <= arcSegments; i++) {
        const angle = startRad + (i / arcSegments) * angleRange;
        points.push(new THREE.Vector3(
            entity.center[0] + Math.cos(angle) * entity.radius,
            entity.center[1] + Math.sin(angle) * entity.radius,
            entity.center[2]
        ));
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({ color });
    const arc = new THREE.Line(geometry, material);
    arc.name = `Arc_${entity.id}`;

    return arc;
}

/**
 * POLYLINE 엔티티 변환
 */
function convertPolyline(
    entity: PolylineEntity,
    color: THREE.Color,
    segments: number
): THREE.Line {
    const points: THREE.Vector3[] = [];

    for (let i = 0; i < entity.vertices.length; i++) {
        const vertex = entity.vertices[i];
        const nextVertex = entity.vertices[(i + 1) % entity.vertices.length];

        points.push(new THREE.Vector3(
            vertex.position[0],
            vertex.position[1],
            vertex.position[2]
        ));

        // Bulge 처리 (호)
        if (vertex.bulge && vertex.bulge !== 0 && (i < entity.vertices.length - 1 || entity.closed)) {
            const arcPoints = calculateBulgeArc(
                vertex.position,
                nextVertex.position,
                vertex.bulge,
                segments
            );
            points.push(...arcPoints);
        }
    }

    // 닫힌 폴리라인
    if (entity.closed && entity.vertices.length > 0) {
        points.push(new THREE.Vector3(
            entity.vertices[0].position[0],
            entity.vertices[0].position[1],
            entity.vertices[0].position[2]
        ));
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({ color });
    const polyline = new THREE.Line(geometry, material);
    polyline.name = `Polyline_${entity.id}`;

    return polyline;
}

/**
 * Bulge 값으로 호 계산
 */
function calculateBulgeArc(
    start: Vector3,
    end: Vector3,
    bulge: number,
    segments: number
): THREE.Vector3[] {
    const points: THREE.Vector3[] = [];

    // Bulge에서 호 파라미터 계산
    const angle = 4 * Math.atan(Math.abs(bulge));
    const dist = Math.sqrt(
        Math.pow(end[0] - start[0], 2) +
        Math.pow(end[1] - start[1], 2)
    );
    const radius = dist / (2 * Math.sin(angle / 2));

    // 중심점 계산
    const midX = (start[0] + end[0]) / 2;
    const midY = (start[1] + end[1]) / 2;

    const dx = end[0] - start[0];
    const dy = end[1] - start[1];

    const perpX = -dy;
    const perpY = dx;
    const perpLen = Math.sqrt(perpX * perpX + perpY * perpY);

    if (perpLen === 0) return points;

    const h = Math.sqrt(Math.max(0, radius * radius - (dist / 2) * (dist / 2)));
    const direction = bulge > 0 ? 1 : -1;

    const centerX = midX + (direction * h * perpX) / perpLen;
    const centerY = midY + (direction * h * perpY) / perpLen;

    // 시작/끝 각도
    const startAngle = Math.atan2(start[1] - centerY, start[0] - centerX);
    let endAngle = Math.atan2(end[1] - centerY, end[0] - centerX);

    if (bulge > 0 && endAngle < startAngle) {
        endAngle += Math.PI * 2;
    } else if (bulge < 0 && endAngle > startAngle) {
        endAngle -= Math.PI * 2;
    }

    const arcSegments = Math.max(2, Math.ceil((Math.abs(endAngle - startAngle) / (Math.PI * 2)) * segments));

    for (let i = 1; i < arcSegments; i++) {
        const t = i / arcSegments;
        const a = startAngle + t * (endAngle - startAngle);
        points.push(new THREE.Vector3(
            centerX + Math.cos(a) * radius,
            centerY + Math.sin(a) * radius,
            (start[2] + end[2]) / 2
        ));
    }

    return points;
}

/**
 * POINT 엔티티 변환
 */
function convertPoint(entity: PointEntity, color: THREE.Color): THREE.Points {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array([
        entity.position[0],
        entity.position[1],
        entity.position[2],
    ]);
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({ color, size: 5, sizeAttenuation: false });
    const point = new THREE.Points(geometry, material);
    point.name = `Point_${entity.id}`;

    return point;
}

/**
 * SPLINE 엔티티 변환 (Catmull-Rom 스플라인 근사)
 */
function convertSpline(entity: SplineEntity, color: THREE.Color): THREE.Line {
    const controlPoints = entity.controlPoints.map(
        (cp) => new THREE.Vector3(cp[0], cp[1], cp[2])
    );

    if (controlPoints.length < 2) {
        const geometry = new THREE.BufferGeometry().setFromPoints(controlPoints);
        const material = new THREE.LineBasicMaterial({ color });
        return new THREE.Line(geometry, material);
    }

    // Catmull-Rom 스플라인 사용
    const curve = new THREE.CatmullRomCurve3(controlPoints, entity.closed, 'catmullrom', 0.5);
    const points = curve.getPoints(controlPoints.length * 10);

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({ color });
    const spline = new THREE.Line(geometry, material);
    spline.name = `Spline_${entity.id}`;

    return spline;
}

/**
 * ELLIPSE 엔티티 변환
 */
function convertEllipse(entity: EllipseEntity, color: THREE.Color, segments: number): THREE.Line {
    const points: THREE.Vector3[] = [];

    // 장축 길이와 회전 각도 계산
    const majorLen = Math.sqrt(
        entity.majorAxis[0] ** 2 +
        entity.majorAxis[1] ** 2 +
        entity.majorAxis[2] ** 2
    );
    const rotation = Math.atan2(entity.majorAxis[1], entity.majorAxis[0]);
    const minorLen = majorLen * entity.minorAxisRatio;

    // 각도 범위
    const startAngle = entity.startAngle;
    let endAngle = entity.endAngle;
    if (endAngle < startAngle) {
        endAngle += Math.PI * 2;
    }

    const angleRange = endAngle - startAngle;
    const arcSegments = Math.max(2, Math.ceil((angleRange / (Math.PI * 2)) * segments));

    for (let i = 0; i <= arcSegments; i++) {
        const t = startAngle + (i / arcSegments) * angleRange;

        // 로컬 좌표계에서 타원 점
        const localX = Math.cos(t) * majorLen;
        const localY = Math.sin(t) * minorLen;

        // 회전 적용
        const worldX = localX * Math.cos(rotation) - localY * Math.sin(rotation);
        const worldY = localX * Math.sin(rotation) + localY * Math.cos(rotation);

        points.push(new THREE.Vector3(
            entity.center[0] + worldX,
            entity.center[1] + worldY,
            entity.center[2]
        ));
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({ color });
    const ellipse = new THREE.Line(geometry, material);
    ellipse.name = `Ellipse_${entity.id}`;

    return ellipse;
}
