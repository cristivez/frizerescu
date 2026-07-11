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
      // Center in z too (extrusion runs 0→depth): otherwise the mesh rotates
      // around its BACK plane instead of its middle (asymmetric swing) and the
      // whole body sits in front of the plane the frustum fit is computed at.
      const cz = (bb.max.z + bb.min.z) / 2;
      const geoW = bb.max.x - bb.min.x;
      const geoH = bb.max.y - bb.min.y;
      const geoD = bb.max.z - bb.min.z;
      geometry.translate(-cx, -cy, -cz);

      const material = new THREE.MeshStandardMaterial({
        color: 0xcaa96a,
        metalness: 1,
        roughness: 0.34,
        side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(geometry, material);

      const group = new THREE.Group();
      group.add(mesh);
      // The canvas is inflated past the visible logo box (the -inset on the mount
      // div) so the logo has room to turn inside it; FILL is the logo's fraction
      // of that *larger* canvas, paired with the inset so the logo still appears
      // at the intended size while never crossing the canvas edge as it rotates.
      //   rock (hero):   130% canvas, 0.69 → appears ~90% of the box; the hero is
      //     large, so its margin is ample for the ±29° rock.
      //   scroll (header): 156% canvas, 0.47 → still appears ~73% of the box, but
      //     the wider canvas gives the small mark enough clearance to spin through
      //     FULL 360° turns (perspective magnifies its edge most around 45–60°)
      //     without clipping. (The fallback width below matches, per mode.)
      const FILL = mode === "scroll" ? 0.47 : 0.69;
      const visH = 2 * camera.position.z * Math.tan((camera.fov * Math.PI) / 360);
      const visW = visH * (width / height);
      const fitBase = Math.min(visW / geoW, visH / geoH) * FILL;
      // Perspective correction: the mesh has depth, and front-faced its widest
      // cross-section (the bevel base) sits ~(geoD/2 − bevelThickness) in front
      // of the z=0 plane the frustum fit was computed at — so it projects ~2%
      // larger than the flat fallback, a visible size pop at the crossfade.
      // Shrink fit so the projected silhouette matches the fallback exactly.
      const frontZ = (geoD / 2 - 4) * fitBase; // 4 = bevelThickness
      const fit = fitBase * ((camera.position.z - frontZ) / camera.position.z);
      group.scale.set(fit, -fit, fit); // flip Y: SVG is y-down
      scene.add(group);

      // The mesh enters EXACTLY as the flat fallback looks — front-faced, no
      // tilt, same on-screen size — and the fallback only starts fading after
      // this first frame is painted, so the crossfade swaps two identical
      // silhouettes (invisible). The resting tilt then eases in below and the
      // logo "wakes up", instead of jump-cutting between two projections.
      renderer.render(scene, camera);
      if (fallbackRef.current) fallbackRef.current.style.opacity = "0";

      const TILT = mode === "scroll" ? 0.14 : 0.16;
      const SETTLE_S = 1.2;
      // 0→1 easeOutCubic over the first SETTLE_S seconds. Scales the resting
      // tilt AND (in scroll mode) the scroll angle, so the mesh always STARTS
      // front-faced — matching the fallback even when the page loads
      // mid-scroll — and swings to its real pose from there.
      const easedAt = (t: number) => {
        const s = Math.min(1, t / SETTLE_S);
        return 1 - (1 - s) ** 3;
      };
      // Calibration hook: ?logo3d-freeze pins the mesh at the exact swap pose
      // (front-faced, no tilt, no motion) so the fallback and WebGL silhouettes
      // can be compared pixel-for-pixel. Inert in normal use.
      const freeze = window.location.search.includes("logo3d-freeze");

      let raf = 0;
      let scrollRaf = 0;
      if (mode === "scroll") {
        // Spin the logo through several FULL turns as the page scrolls, landing
        // front-faced at both ends. Driving off scroll PROGRESS (0 at the top, 1
        // at the bottom) times a whole number of turns means the angle is 0 at
        // the top and turns·2π at the bottom — both exact multiples of 360°, i.e.
        // front-faced — while spinning continuously in between. The turn count
        // tracks page length (~one turn per 1571px, matching the original feel)
        // and rounds so the bottom always resolves to front. Rendered on change.
        let settleEase = 0; // reaches 1 after SETTLE_S, then stays
        const applyScroll = () => {
          scrollRaf = 0;
          const max = document.documentElement.scrollHeight - window.innerHeight;
          const progress = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
          const turns = Math.max(1, Math.round((max * 0.004) / (2 * Math.PI)));
          group.rotation.y = progress * turns * 2 * Math.PI * settleEase;
          renderer.render(scene, camera);
        };
        const onScroll = () => {
          if (!scrollRaf) scrollRaf = requestAnimationFrame(applyScroll);
        };
        window.addEventListener("scroll", onScroll, { passive: true });
        applyScroll();
        // Ease tilt + scroll angle in over the first SETTLE_S (rendering each
        // frame), then park; afterwards it renders only on scroll, as before.
        const t0 = performance.now();
        const settle = (now: number) => {
          settleEase = freeze ? 0 : easedAt((now - t0) / 1000);
          group.rotation.x = TILT * settleEase;
          applyScroll();
          if (now - t0 < SETTLE_S * 1000) raf = requestAnimationFrame(settle);
        };
        raf = requestAnimationFrame(settle);
        cleanup = () => window.removeEventListener("scroll", onScroll);
      } else {
        const clock = new THREE.Clock();
        let elapsed = 0;
        const tick = () => {
          elapsed += clock.getDelta();
          if (freeze) elapsed = 0;
          group.rotation.x = TILT * easedAt(elapsed);
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
      {/* The WebGL canvas is inflated past the logo box on every side (a
          transparent, non-interactive layer) so the logo has room to rotate
          without its edges leaving the frame and clipping — wider for the header
          (28%), whose logo spins through full 360° turns, than for the hero
          (15%), which only rocks. FILL (above) scales the logo to still appear at
          the intended size within whichever canvas. */}
      <div
        ref={mountRef}
        className={cn(
          "pointer-events-none absolute",
          mode === "scroll" ? "-inset-[28%]" : "-inset-[15%]",
        )}
      />
      {/* Flat brass logo, centered at the SAME ~90% width the WebGL logo fills,
          so the swap is a pure crossfade with no size/colour jump (and a clean
          static logo for reduced-motion / no-WebGL). */}
      <div
        ref={fallbackRef}
        className="pointer-events-none absolute inset-0 flex items-center justify-center transition-opacity duration-300"
        aria-hidden="true"
      >
        {/* Sized by HEIGHT so the DRAWN logo matches the WebGL silhouette at the
            swap pose exactly. Base fraction = FILL × canvas inflation (0.69×1.30,
            0.47×1.56), then ×1.058 because the SVG viewBox has ~5.8% internal
            padding the mesh geometry doesn't (calibrated pixel-for-pixel against
            the ?logo3d-freeze pose; silhouettes now agree within ~1%). */}
        <Logo
          className={cn(mode === "scroll" ? "h-[77.6%]" : "h-[94.9%]", "w-auto text-accent")}
        />
      </div>
    </div>
  );
}
