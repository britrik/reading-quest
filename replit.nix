{pkgs}: {
  deps = [
    pkgs.libgbm
    pkgs.libGL
    pkgs.mesa
    pkgs.at-spi2-core
    pkgs.cairo
    pkgs.pango
    pkgs.alsa-lib
    pkgs.xorg.libxcb
    pkgs.xorg.libXrandr
    pkgs.xorg.libXfixes
    pkgs.xorg.libXext
    pkgs.xorg.libXdamage
    pkgs.xorg.libXcomposite
    pkgs.xorg.libX11
    pkgs.libxkbcommon
    pkgs.expat
    pkgs.dbus
    pkgs.libdrm
    pkgs.cups
    pkgs.at-spi2-atk
    pkgs.atk
    pkgs.nspr
    pkgs.nss
    pkgs.glib
  ];
}
