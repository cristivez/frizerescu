"use client";

import { useEffect, useRef } from "react";
import { ExtrudedLogo } from "@/components/ui/ExtrudedLogo";
import { LOGO_PATH } from "@/components/ui/logo-path";
import { cn } from "@/lib/cn";

/**
 * The logo as a real solid 3D object: the SVG shape is extruded into a beveled
 * brass mesh (not lines on a plate) and lit by a studio environment so it reads
 * as milled metal with genuine thickness and edges. three.js is loaded lazily
 * (client-only, after paint) so it never touches the critical path. The flat
 * ExtrudedLogo shows as the fallback and stays put under reduced motion, where
 * WebGL is skipped entirely.
 */
export function Logo3D({ className }: { className?: string }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const fallbackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    // Reduced motion: don't ship/animate WebGL — the flat fallback stays.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let disposed = false;
    let cleanup = () => {};

    (async () => {
      const THREE = await import("three");
      const { SVGLoader } = await import("three/examples/jsm/loaders/SVGLoader.js");
      const { RoomEnvironment } = await import(
        "three/examples/jsm/environments/RoomEnvironment.js"
      );
      if (disposed || !mount.clientWidth) return;

      const width = mount.clientWidth;
      const height = mount.clientHeight || width * 0.6;

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(width, height);
      mount.appendChild(renderer.domElement);

      const scene = new THREE.Scene();

      // Procedural studio environment → the metal has something to reflect
      // (metalness 1 without an env map renders black).
      const pmrem = new THREE.PMREMGenerator(renderer);
      scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

      const camera = new THREE.PerspectiveCamera(35, width / height, 1, 3000);
      camera.position.set(0, 0, 560);

      const key = new THREE.DirectionalLight(0xffffff, 2.4);
      key.position.set(-1.5, 2, 3);
      const warm = new THREE.DirectionalLight(0xffdca0, 1.6);
      warm.position.set(2.5, -0.5, 1.5);
      scene.add(key, warm, new THREE.AmbientLight(0xffffff, 0.25));

      // SVG path → filled shapes (with holes) → extruded, beveled mesh.
      // fill-rule="evenodd" is essential: the logo's holes (letter counters,
      // outline gaps, blade slots) rely on it — without it the parser fills the
      // whole silhouette solid and the wordmark disappears.
      const svg = `<svg xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="${LOGO_PATH}"/></svg>`;
      const shapes = new SVGLoader()
        .parse(svg)
        .paths.flatMap((p) => SVGLoader.createShapes(p));

      const geometry = new THREE.ExtrudeGeometry(shapes, {
        depth: 20,
        bevelEnabled: true,
        bevelThickness: 4,
        bevelSize: 2.4,
        bevelSegments: 4,
        curveSegments: 10,
      });
      geometry.computeBoundingBox();
      const bb = geometry.boundingBox!;
      const cx = (bb.max.x + bb.min.x) / 2;
      const cy = (bb.max.y + bb.min.y) / 2;
      const span = Math.max(bb.max.x - bb.min.x, bb.max.y - bb.min.y);
      geometry.translate(-cx, -cy, 0);

      const material = new THREE.MeshStandardMaterial({
        color: 0xcaa96a,
        metalness: 1,
        roughness: 0.34,
        side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(geometry, material);

      const group = new THREE.Group();
      group.add(mesh);
      const fit = 330 / span;
      group.scale.set(fit, -fit, fit); // flip Y: SVG is y-down
      group.rotation.x = 0.16;
      scene.add(group);

      // Reveal once WebGL has a frame up.
      if (fallbackRef.current) fallbackRef.current.style.opacity = "0";

      const clock = new THREE.Clock();
      let raf = 0;
      let elapsed = 0;
      const tick = () => {
        elapsed += clock.getDelta();
        group.rotation.y = Math.sin(elapsed * 0.5) * 0.5; // gentle ±29° rock
        renderer.render(scene, camera);
        raf = requestAnimationFrame(tick);
      };
      tick();

      const onResize = () => {
        const w = mount.clientWidth;
        const h = mount.clientHeight || w * 0.6;
        renderer.setSize(w, h);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      };
      window.addEventListener("resize", onResize);

      cleanup = () => {
        window.removeEventListener("resize", onResize);
        if (raf) cancelAnimationFrame(raf);
        geometry.dispose();
        material.dispose();
        pmrem.dispose();
        renderer.dispose();
        renderer.domElement.remove();
      };
    })().catch(() => {
      /* WebGL unavailable → the flat fallback simply stays visible. */
    });

    return () => {
      disposed = true;
      cleanup();
    };
  }, []);

  return (
    <div className={cn("relative", className)}>
      <div ref={mountRef} className="absolute inset-0" />
      <div
        ref={fallbackRef}
        className="pointer-events-none transition-opacity duration-700"
        aria-hidden="true"
      >
        <ExtrudedLogo depth={10} />
      </div>
    </div>
  );
}
