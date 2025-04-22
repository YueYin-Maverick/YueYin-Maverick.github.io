import os
import gc
import pickle
import numpy as np
import plotly.graph_objects as go
from plotly.colors import sample_colorscale
from PIL import Image, ImageDraw, ImageFont
import colorsys
import pickle


with open('Phases_Dict.pkl', 'rb') as fp:
    Phases_Dict = pickle.load(fp)


template_paths = {
    'QV1': './QVtemplate/1.png',
    'QV2': './QVtemplate/2.png',
    'QV3': './QVtemplate/3.png',
    'QV4': './QVtemplate/4.png',
    'QV5': './QVtemplate/5.png',
    'QV6': './QVtemplate/6.png',
}


site_coords = {
    'QV1': {
        0: (138, 121), 1: (209, 162), 2: (174, 222),
        3: ( 68, 121), 4: ( 34, 182), 5: (104, 222),
        'M1': ( 86, 172), 'M2': (156, 172),
    },
    'QV2': {
        0: ( 68, 242), 1: ( 68, 162), 2: (139, 162),
        3: (209, 162), 4: (209, 242), 5: (139, 242),
        'M1': (174, 202), 'M2': (103, 202),
    },
    'QV3': {
        0: (208, 161), 1: (208, 242), 2: (138, 241),
        3: (137, 120), 4: ( 68, 161), 5: (103, 221),
        'M1': (172, 201), 'M2': (120, 170),
    },
    'QV4': {
        0: (208, 120), 1: (105, 100), 2: (174,  61),
        3: (140, 162), 4: (208, 162), 5: (208, 242),
        'M1': (174, 202), 'M2': (156, 111),
    },
    'QV5': {
        0: (207, 119), 1: (207,  38), 2: (136, 119), 3: (137,  38),
        4: (138, 159), 5: (207, 159), 6: (207, 241), 7: (137, 241),
        'M1': (174, 202), 'M2': (174,  80),
    },
    'QV6': {
        0: ( 68, 120), 1: (102,  60), 2: (172, 100),
        3: (140, 162), 4: (208, 162), 5: (208, 242), 6: (139, 241),
        'M1': (174, 202), 'M2': (120, 110),
    },
}


metal_colors = {
    "Al": "#00FA9A",
    "Sc": "#FFB6C1",
    "Ti": "#B0C4DE",
    "V":  "#7FFFD4",
    "Cr": "#FF6347",
    "Mn": "#4682B4",
    "Fe": "#FF4500",
    "Co": "#8A2BE2",
    "Ni": "#2E8B57",
    "Cu": "#D2691E",
    "Zn": "#6495ED",
    "Ga": "#F08080",
    "Ge": "#E0FFFF",
    "Y":  "#32CD32",
    "Zr": "#40E0D0",
    "Nb": "#9ACD32",
    "Mo": "#FF7F50",
    "Tc": "#9932CC",
    "Ru": "#DAA520",
    "Rh": "#DC143C",
    "Pd": "#FFD700",
    "Ag": "#C0C0C0",
    "Cd": "#B8860B",
    "In": "#FA8072",
    "Sn": "#E9967A",
    "Sb": "#ADD8E6",
    "Ce": "#8FBC8F",
    "Hf": "#BA55D3",
    "Ta": "#87CEFA",
    "W":  "#7FFF00",
    "Re": "#FFDAB9",
    "Os": "#FFC0CB",
    "Ir": "#CD5C5C",
    "Pt": "#4B0082",
    "Au": "#FFD700",
    "Tl": "#FFFACD",
    "Pb": "#90EE90",
    "Bi": "#DDA0DD",}


metal_radii = {
    "Al": 126,
    "Sc": 148,
    "Ti": 136,
    "V":  134,
    "Cr": 122,
    "Mn": 119,
    "Fe": 116,
    "Co": 111,
    "Ni": 110,
    "Cu": 112,
    "Zn": 118,
    "Ga": 124,
    "Ge": 121,
    "Y":  163,
    "Zr": 154,
    "Nb": 147,
    "Mo": 138,
    "Tc": 128,
    "Ru": 125,
    "Rh": 125,
    "Pd": 120,
    "Ag": 128,
    "Cd": 136,
    "In": 142,
    "Sn": 140,
    "Sb": 140,
    "Ce": 163,
    "Hf": 152,
    "Ta": 146,
    "W":  137,
    "Re": 131,
    "Os": 129,
    "Ir": 122,
    "Pt": 123,
    "Au": 124,
    "Tl": 144,
    "Pb": 144,
    "Bi": 151,
}


def Plot_Phase_Disgram(m1, m2, planes):
    pair = tuple(sorted((m1, m2)))
    labels = [p[-1] for p in planes]
    planes_coef = [p[:-1] for p in planes]

    eta_C, eta_N = -9.2230488, -8.3162684
    x_min, x_max = eta_C - 5, eta_C + 5
    y_min, y_max = eta_N - 5, eta_N + 5

    res = 500
    x = np.linspace(x_min, x_max, res)
    y = np.linspace(y_min, y_max, res)
    X, Y = np.meshgrid(x, y)

    zs = [(-a*X - b*Y - d)/c for (a, b, c, d) in planes_coef]
    Z  = np.stack(zs, axis=0)

    min_idx   = np.argmin(Z, axis=0)
    valid_idx = np.unique(min_idx)
    zmin, zmax = valid_idx.min(), valid_idx.max()

    hover_text    = np.array(labels, dtype=object)[min_idx]
    hovertemplate = "x: %{x:.2f}<br>y: %{y:.2f}<br>Phase: %{text}<extra></extra>"

    fig = go.Figure(data=go.Heatmap(
        z=min_idx, x=x, y=y, text=hover_text,
        hovertemplate=hovertemplate, showscale=False,
        colorscale='Viridis', zmin=zmin, zmax=zmax
    ))

    fig.add_trace(go.Scatter(
        x=[eta_C, eta_C], y=[y_min, y_max],
        mode='lines', line=dict(color='gray', width=3),
        name="μ_C from Graphene", opacity=0.5
    ))
    fig.add_trace(go.Scatter(
        x=[x_min, x_max], y=[eta_N, eta_N],
        mode='lines', line=dict(color='gray', width=3),
        name="μ_N from Graphene", opacity=0.5
    ))

    _, idx = np.unique(min_idx[250], return_index=True)
    ordered_idx = min_idx[250][np.sort(idx)]

    for idx in ordered_idx:
        frac   = idx / zmax if zmax != 0 else 0
        clr_pt = sample_colorscale('Viridis', frac)[0]
        fig.add_trace(go.Scatter(
            x=[None], y=[None],
            mode='markers',
            marker=dict(size=10, color=clr_pt),
            legendgroup=labels[idx],
            showlegend=True,
            name=labels[idx]
        ))

    fig.update_layout(
        title=dict(
            text=f"Phase Diagram of {pair[0]}-{pair[1]}",
            x=0.41, xanchor='center',
            font=dict(family="Times New Roman", size=40)
        ),
        xaxis=dict(
            range=[x_min, x_max], title="$\\eta_C$",
            titlefont=dict(family="Times New Roman", size=24),
            tickfont=dict(family="Times New Roman", size=20)
        ),
        yaxis=dict(
            range=[y_min, y_max], title="$\\eta_N$",
            titlefont=dict(family="Times New Roman", size=24),
            tickfont=dict(family="Times New Roman", size=20)
        ),
        width=900, height=700,
        showlegend=True,
        legend=dict(
            orientation="v", y=1, xanchor="left", x=1.02,
            font=dict(family="Times New Roman", size=20)
        ),
        margin=dict(l=80, r=200, t=80, b=80)
    )

    html_str = fig.to_html(
        include_plotlyjs="cdn",
        include_mathjax="cdn",
        full_html=False
    )

    fig.data = []
    fig.layout = {}
    del fig
    gc.collect()

    legend_list = [labels[idx] for idx in ordered_idx]
    return html_str, legend_list


def make_inset(legend_str, out_dir='./insets', metal_font_size=35):
    qv, sites_str, m1, m2 = legend_str.split('_')
    img = Image.open(template_paths[qv]).convert('RGBA')
    draw = ImageDraw.Draw(img)


    font_path = r"C:\Windows\Fonts\arialbd.ttf"
    font = ImageFont.truetype(font_path, metal_font_size)

    all_sites = [k for k in site_coords[qv] if isinstance(k, int)]
    present   = [int(ch) for ch in sites_str] if sites_str else []

    for idx in all_sites:
        if idx not in present:
            x,y = site_coords[qv][idx]
            draw.ellipse((x-12, y-12, x+12, y+12), fill='blue')

    for pos_label, metal in (('M1', m1), ('M2', m2)):
        x,y = site_coords[qv][pos_label]
        clr = metal_colors.get(metal, '#000000')
        r = 12 * metal_radii.get(metal, 20) / 75
        draw.ellipse((x-r, y-r, x+r, y+r), fill=clr)
        draw.text((x, y), metal, font=font, fill='black', anchor='mm')

    os.makedirs(out_dir, exist_ok=True)
    path = os.path.join(out_dir, f"{legend_str}.png")
    img.save(path)
    return path




def build_full_html(html_main, inset_paths, legend_list, out_html='./Phase_with_insets.html'):

    html_dir = os.path.dirname(os.path.abspath(out_html)) or '.'

    rel_paths = [os.path.relpath(p, start=html_dir) for p in inset_paths]

    imgs_html = "\n".join(
                         f'''<figure style="display:inline-block; text-align:center; margin:5px;">
                             <img src="{rel}" style="height:150px;"><br>
                             <figcaption style="font-size:15px;">{label}</figcaption>
                             </figure>'''
        for rel, label in zip(rel_paths, legend_list))

    full_html = f"""<!DOCTYPE html>
                    <html>
                        <head>
                        <meta charset="utf-8">
                        <title>Phase Diagram with Insets</title>
                        <style>
                          .main  {{
                                    display: flex;
                                    justify-content: center;
                                  }}
                          .insets {{
                                    display: flex;
                                    flex-wrap: wrap;
                                    justify-content: center;
                                    margin-top: 1px;
                                  }}
                        </style>
                        </head>
                        <body>
                            <div class="main">{html_main}</div>
                            <div class="insets">{imgs_html}</div>
                        </body>
                    </html>"""

    os.makedirs(html_dir, exist_ok=True)
    with open(out_html, 'w', encoding='utf-8') as f:
        f.write(full_html)
    print(f"Wrote combined HTML to {out_html}")



if __name__ == "__main__":


    OUTPUT_DIR = './phase_outputs'
    os.makedirs(OUTPUT_DIR, exist_ok=True)


    for pair in list(Phases_Dict.keys()):
        m1, m2 = pair
        planes = Phases_Dict[pair]

        html_main, legend_list = Plot_Phase_Disgram(m1, m2, planes)

        inset_dir = os.path.join(OUTPUT_DIR, f"insets_{m1}_{m2}")
        os.makedirs(inset_dir, exist_ok=True)
        inset_paths = [make_inset(lg, out_dir=inset_dir) for lg in legend_list]

        html_file = os.path.join(OUTPUT_DIR, f"{m1}_{m2}.html")
        build_full_html(html_main, inset_paths, legend_list, out_html=html_file)

        print(f"Completed {m1}-{m2} → {html_file}")