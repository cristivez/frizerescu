"use client";

import { useEffect, useRef } from "react";
import { Logo } from "@/components/ui/Logo";
import { LOGO_PATH } from "@/components/ui/logo-path";
import { cn } from "@/lib/cn";

/**
 * The logo as a real solid 3D object: the SVG shape is extruded into a beveled
 * brass mesh (not lines on a plate) and lit by a studio environment so it reads
 * as milled metal with genuine thickness and edges. three.js is loaded lazily
 * (client-only, after paint) so it never touches the critical path. A flat
 * brass Logo shows as the fallback — same colour, size and orientation as the
 * mesh, so the swap is invisible — and stays put under reduced motion / no
 * WebGL, where three.js is never fetched.
 *
 * mode "rock"   — a gentle continuous ±29° sway (the hero centerpiece).
 * mode "scroll" — rotationY driven by scroll position, rendered only while
 *                 scrolling (idle = no GPU work); used for the small header logo.
 */
export function Logo3D({
  className,
  mode = "rock",
}: {
  className?: string;
  mode?: "rock" | "scroll";
}) {
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

      // Procedural studio environment → the metal has something to reflect.
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
      const geoW = bb.max.x - bb.min.x;
      const geoH = bb.max.y - bb.min.y;
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
      // The canvas is inflated 15% past the visible logo box on every side (the
      // -inset on the mount div → a 130%-size canvas), so FILL is the logo's
      // fraction of that *larger* canvas, not of the visible box.
      //   rock (hero):   0.69 * 1.30 ≈ 0.90 → appears at ~90% of the box. At the
      //     hero's size the leftover ~6% margin is tens of px — ample for ±29°.
      //   scroll (header): a smaller 0.56 → appears at ~73% of the box. The
      //     header canvas is only ~39px tall, where a 6% margin is ~2px and
      //     antialiasing eats it, so the small mark is given a wider proportional
      //     margin to turn inside. (The fallback width below matches, per mode.)
      const FILL = mode === "scroll" ? 0.56 : 0.69;
      const visH = 2 * camera.position.z * Math.tan((camera.fov * Math.PI) / 360);
      const visW = visH * (width / height);
      const fit = Math.min(visW / geoW, visH / geoH) * FILL;
      group.scale.set(fit, -fit, fit); // flip Y: SVG is y-down
      group.rotation.x = mode === "scroll" ? 0.14 : 0.16;
      scene.add(group);

      // Reveal once WebGL has a frame up.
      if (fallbackRef.current) fallbackRef.current.style.opacity = "0";

      let raf = 0;
      let scrollRaf = 0;
      if (mode === "scroll") {
        // Drive rotation from scroll PROGRESS (0 at the top, 1 at the bottom of
        // the page), not raw pixels. sin(progress·2π) is one full sway over the
        // page: 0 at BOTH ends (so the logo faces front at the top and the
        // bottom) with a clearly visible turn each way in between — +0.5 rad a
        // quarter down, back through front at the middle, −0.5 rad three-quarters
        // down. A single half-sine spread the turn so thinly over a tall page it
        // read as motionless; ±0.5 rad (~29°) is the most the canvas holds either
        // way, and the sway count doesn't change that. Rendered only on change.
        const applyScroll = () => {
          scrollRaf = 0;
          const max = document.documentElement.scrollHeight - window.innerHeight;
          const progress = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
          group.rotation.y = 0.5 * Math.sin(progress * Math.PI * 2);
          renderer.render(scene, camera);
        };
        const onScroll = () => {
          if (!scrollRaf) scrollRaf = requestAnimationFrame(applyScroll);
        };
        window.addEventListener("scroll", onScroll, { passive: true });
        applyScroll();
        cleanup = () => window.removeEventListener("scroll", onScroll);
      } else {
        const clock = new THREE.Clock();
        let elapsed = 0;
        const tick = () => {
          elapsed += clock.getDelta();
          group.rotation.y = Math.sin(elapsed * 0.5) * 0.5; // gentle ±29° rock
          renderer.render(scene, camera);
          raf = requestAnimationFrame(tick);
        };
        tick();
      }

      const onResize = () => {
        const w = mount.clientWidth;
        const h = mount.clientHeight || w * 0.6;
        renderer.setSize(w, h);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.render(scene, camera);
      };
      window.addEventListener("resize", onResize);

      const disposeGl = cleanup;
      cleanup = () => {
        disposeGl();
        window.removeEventListener("resize", onResize);
        if (raf) cancelAnimationFrame(raf);
        if (scrollRaf) cancelAnimationFrame(scrollRaf);
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
  }, [mode]);

  return (
    <div className={cn("relative", className)}>
      {/* The WebGL canvas is inflated 15% past the logo box on every side (a
          130%-size, transparent, non-interactive layer) so the logo has just
          enough room to turn without its edges leaving the frame and clipping.
          The logo itself is scaled (FILL) to still *appear* at ~90% of the
          visible box. */}
      <div ref={mountRef} className="pointer-events-none absolute -inset-[15%]" />
      {/* Flat brass logo, centered at the SAME ~90% width the WebGL logo fills,
          so the swap is a pure crossfade with no size/colour jump (and a clean
          static logo for reduced-motion / no-WebGL). */}
      <div
        ref={fallbackRef}
        className="pointer-events-none absolute inset-0 flex items-center justify-center transition-opacity duration-700"
        aria-hidden="true"
      >
        {/* Width matches the WebGL logo's on-screen size per mode (see FILL) so
            the crossfade has no size jump. */}
        <Logo className={cn(mode === "scroll" ? "w-[73%]" : "w-[90%]", "text-accent")} />
      </div>
    </div>
  );
}
